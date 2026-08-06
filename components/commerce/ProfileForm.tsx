'use client'
/**
 * "Mijn gegevens" — naam, telefoonnummer en de nieuwsbriefkeuze.
 *
 * Het E-MAILADRES staat er wel, maar als vaste tekst: dat is de inlognaam. Het laten wijzigen zonder
 * verificatie van het nieuwe adres zou betekenen dat één typefout een account onbereikbaar maakt, en
 * dat een overgenomen sessie het account stil kan overnemen. Wie zijn adres wil wijzigen, neemt
 * contact op met de winkel — dat is bewust, geen ontbrekende functie.
 *
 * Het wachtwoord loopt via "wachtwoord vergeten": dat pad heeft al een bevestiging per e-mail.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * OPSLAAN GAAT IN TWEE STAPPEN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * "Opslaan" bewaart nog niets: het CMS mailt een code van zes cijfers en dit formulier vraagt die op.
 * Pas met die code gaat de wijziging naar de database.
 *
 * Waarom die extra stap: een sessie leeft dertig dagen. Een cookie op een gedeelde computer, of een
 * laptop die iemand even open laat staan, is dus dertig dagen een sleutel — en zonder bevestiging kan
 * wie hem heeft stil de naam en het telefoonnummer van een account veranderen. Dat is precies wat je
 * doet vóórdat je iets laat bezorgen.
 *
 * De nieuwe waarden blijven tussen de twee stappen ALLEEN in dit component staan. Geen cookie, geen
 * server-side "wachtende wijziging": één plek waar een half opgeslagen wijziging kan bestaan, is één
 * plek te veel. Herlaadt de bezoeker de pagina, dan is de wijziging weg en typt hij hem opnieuw.
 */
import * as React from 'react'

import type { Customer } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

type Status = 'idle' | 'saving' | 'code' | 'saved' | 'error'

/** Zes cijfers, zoals het CMS ze uitgeeft. */
const CODE_LENGTH = 6

/** Zelfde wachttijd als in het CMS (`RESEND_COOLDOWN_SECONDS`). */
const RESEND_COOLDOWN_SECONDS = 60

export function ProfileForm({ customer, ui }: { customer: Customer; ui: ShopUIStrings }) {
  const [firstName, setFirstName] = React.useState(customer.firstName ?? '')
  const [lastName, setLastName] = React.useState(customer.lastName ?? '')
  const [phone, setPhone] = React.useState(customer.phone ?? '')
  const [acceptsMarketing, setAcceptsMarketing] = React.useState(customer.acceptsMarketing === true)

  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState('')
  const [notice, setNotice] = React.useState('')

  const [code, setCode] = React.useState('')
  const [resendIn, setResendIn] = React.useState(0)

  React.useEffect(() => {
    if (resendIn <= 0) return
    const timer = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  /** De wijziging zoals hij naar het CMS gaat; met `code` is het stap 2. */
  async function send(withCode?: string) {
    const res = await fetch('/api/commerce/account', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
        acceptsMarketing,
        ...(withCode ? { code: withCode } : {}),
      }),
    })
    return (await res.json().catch(() => null)) as {
      ok?: boolean
      error?: string
      code?: string
      data?: { needsCode?: boolean; codeSent?: boolean; saved?: boolean; unchanged?: boolean; message?: string }
    } | null
  }

  /** Stap 1: wijziging insturen → het CMS mailt een code. */
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    setMessage('')
    setNotice('')

    let result: Awaited<ReturnType<typeof send>> = null
    try {
      result = await send()
    } catch {
      setStatus('error')
      setMessage(ui.genericError)
      return
    }

    if (!result?.ok) {
      setStatus('error')
      setMessage(result?.error ?? ui.genericError)
      return
    }

    // Niets veranderd → geen code, geen mail, geen tweede stap.
    if (result.data?.unchanged) {
      setStatus('saved')
      return
    }

    setStatus('code')
    setNotice(result.data?.message ?? ui.codeSentText)
    // `codeSent: false` betekent dat de wachttijd nog liep; dan geldt de vorige code nog.
    setResendIn(result.data?.codeSent === false ? 0 : RESEND_COOLDOWN_SECONDS)
  }

  /** Stap 2: de code bevestigt de wijziging. */
  async function onConfirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('saving')
    setMessage('')
    setNotice('')

    let result: Awaited<ReturnType<typeof send>> = null
    try {
      result = await send(code)
    } catch {
      setStatus('error')
      setMessage(ui.genericError)
      return
    }

    if (!result?.ok) {
      // Terug naar de codestap: de bezoeker moet het opnieuw kunnen proberen of een nieuwe code halen.
      setStatus('code')
      setMessage(result?.error ?? ui.genericError)
      if (result?.code === 'expired' || result?.code === 'too_many_attempts') setCode('')
      return
    }

    setCode('')
    setStatus('saved')
  }

  /** Nieuwe code: precies hetzelfde verzoek als stap 1. */
  async function resend() {
    setMessage('')
    try {
      const result = await send()
      setNotice(result?.data?.message ?? ui.codeSentText)
      setResendIn(result?.data?.codeSent === false ? 0 : RESEND_COOLDOWN_SECONDS)
    } catch {
      setNotice(ui.codeSentText)
    }
  }

  const busy = status === 'saving'

  // ── Stap 2: de code ─────────────────────────────────────────────────────────────────────────
  if (status === 'code' || (busy && code)) {
    return (
      <form className="form profile-form" noValidate onSubmit={onConfirm}>
        <h2 className="auth-title">{ui.codeTitle}</h2>
        <p className="auth-intro">
          {ui.profileCodeIntro} <strong>{customer.email}</strong>
        </p>

        {notice && (
          <p className="form-saved" role="status">
            {notice}
          </p>
        )}

        <div className="form-field form-field--code">
          <label className="form-label" htmlFor="pf-code">
            {ui.codeLabel}
          </label>
          <input
            autoComplete="one-time-code"
            className="code-input"
            id="pf-code"
            inputMode="numeric"
            maxLength={CODE_LENGTH}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            pattern="[0-9]*"
            required
            type="text"
            value={code}
          />
          <span className="form-hint">{ui.codeHint}</span>
        </div>

        {/* Eén foutregel: in deze stap staat de status altijd op `code` (ook na een mislukte poging),
            dus een tweede blok voor `error` zou nooit te zien zijn. */}
        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}

        <div className="form-actions">
          <button className="btn btn-gold" disabled={busy || code.length < CODE_LENGTH} type="submit">
            {busy ? ui.verifyingCode : ui.codeSubmit}
          </button>
          <button
            className="btn btn-outline"
            disabled={busy}
            onClick={() => {
              setStatus('idle')
              setCode('')
              setMessage('')
              setNotice('')
            }}
            type="button"
          >
            {ui.cancel}
          </button>
        </div>

        <div className="auth-links">
          <button className="link-button" disabled={busy || resendIn > 0} onClick={() => void resend()} type="button">
            {resendIn > 0 ? `${ui.codeResend} (${resendIn}s)` : ui.codeResend}
          </button>
        </div>
      </form>
    )
  }

  // ── Stap 1: de gegevens ─────────────────────────────────────────────────────────────────────
  return (
    <form className="form profile-form" noValidate onSubmit={onSubmit}>
      <div className="form-field">
        <span className="form-label">{ui.email}</span>
        <p className="profile-email">{customer.email}</p>
      </div>

      <div className="address-grid">
        <div className="form-field">
          <label className="form-label" htmlFor="pf-firstName">
            {ui.firstName}
          </label>
          <input
            autoComplete="given-name"
            id="pf-firstName"
            onChange={(e) => setFirstName(e.target.value)}
            type="text"
            value={firstName}
          />
        </div>
        <div className="form-field">
          <label className="form-label" htmlFor="pf-lastName">
            {ui.lastName}
          </label>
          <input
            autoComplete="family-name"
            id="pf-lastName"
            onChange={(e) => setLastName(e.target.value)}
            type="text"
            value={lastName}
          />
        </div>
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="pf-phone">
          {ui.phone}
        </label>
        <input
          autoComplete="tel"
          id="pf-phone"
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          value={phone}
        />
      </div>

      <label className="form-check">
        <input
          checked={acceptsMarketing}
          onChange={(e) => setAcceptsMarketing(e.target.checked)}
          type="checkbox"
        />
        <span>{ui.marketingOptIn}</span>
      </label>

      {status === 'error' && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}
      {status === 'saved' && (
        <p className="form-saved" role="status">
          {ui.saved}
        </p>
      )}

      {/* Vooraf zeggen dat er een code komt: anders lijkt "Opslaan" niet te werken. */}
      <p className="form-hint">{ui.profileCodeNote}</p>

      <button className="btn btn-gold" disabled={busy} type="submit">
        {busy ? ui.saving : ui.save}
      </button>
    </form>
  )
}
