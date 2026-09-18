'use client'
/**
 * Generic, data-driven form component.
 *
 * Form definitions live in `content/forms.json` (edited via the CMS Forms editor or the AI agent).
 * This component renders the fields for a given form `slug` and submits to the CMS submit endpoint,
 * which stores the submission (tenant-scoped) and sends the notification email. The submit base URL
 * comes from `NEXT_PUBLIC_FORMS_ENDPOINT` (the CMS origin); it falls back to same-origin.
 *
 * This is a reference implementation — restyle it per template; the data contract (forms.json +
 * the POST shape) stays the same.
 */
import * as React from 'react'

import formsData from '@/content/forms.json'

type Field = {
  name: string
  label: string
  fieldType: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'hidden'
  required?: boolean
  placeholder?: string
  options?: { label: string; value: string }[]
}
export type FormDef = {
  name: string
  submitLabel?: string
  successMessage?: string
  isActive?: boolean
  fields: Field[]
}

const FORMS = (formsData as { forms?: Record<string, FormDef> }).forms || {}

/**
 * `def` (optional): the form definition to render. On i18n sites the server passes the LOCALIZED
 * definition (loadForm(slug, locale) — translated labels/placeholders/button/success text). When
 * omitted, we fall back to the flat, build-time `content/forms.json` (single-language sites / other
 * callers). Submissions post the field `name`s either way, so localization only changes the wording.
 */
/** E-mailcheck: bewust simpel (iets@iets.tld). Alleen om typefouten client-side te vangen; de
 *  CMS-kant valideert definitief. Geen zware regex die geldige adressen afwijst. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Form({ slug, def: defProp }: { slug: string; def?: FormDef | null }) {
  const def = defProp ?? FORMS[slug]
  const formRef = React.useRef<HTMLFormElement>(null)
  const [status, setStatus] = React.useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [message, setMessage] = React.useState('')
  // Per-veld foutmeldingen (client-side, toegankelijk). Leeg = geen fout.
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  /** Valideer één veldwaarde tegen de definitie; geeft een NL-foutmelding of '' terug. */
  function validateField(f: Field, value: string): string {
    const v = (value ?? '').trim()
    if (f.required && !v) return `${f.label} is verplicht.`
    if (f.fieldType === 'email' && v && !EMAIL_RE.test(v)) return 'Vul een geldig e-mailadres in.'
    return ''
  }

  // After a successful submit, show the confirmation for a few seconds, then reset the form so the
  // visitor can send another message (and the section doesn't sit on a stale "thanks" state).
  React.useEffect(() => {
    if (status !== 'ok') return
    const t = setTimeout(() => {
      formRef.current?.reset()
      setStatus('idle')
      setMessage('')
    }, 6000)
    return () => clearTimeout(t)
  }, [status])

  if (!def || def.isActive === false) return null

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    // Client-side validatie vóór verzenden: verplichte velden + e-mailformaat. Bij fouten:
    // markeer de velden (aria-invalid + inline melding), focus het eerste foute veld en verstuur niet.
    const nextErrors: Record<string, string> = {}
    for (const f of def.fields) {
      if (f.fieldType === 'hidden') continue
      const err = validateField(f, String(fd.get(f.name) ?? ''))
      if (err) nextErrors[f.name] = err
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      setStatus('idle')
      setMessage('')
      const firstBad = def.fields.find((f) => nextErrors[f.name])
      if (firstBad) (form.elements.namedItem(firstBad.name) as HTMLElement | null)?.focus()
      return
    }
    setFieldErrors({})
    setStatus('sending')
    setMessage('')
    const data: Record<string, unknown> = {}
    fd.forEach((v, k) => { data[k] = v })
    // CMS origin (e.g. https://cms.bedigital.nl). Empty = same origin.
    const base = process.env.NEXT_PUBLIC_FORMS_ENDPOINT || ''
    try {
      const res = await fetch(`${base}/forms/${slug}/submit`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.ok) {
        setStatus('ok')
        setMessage(body.message || def.successMessage || 'Bedankt voor je bericht.')
      } else {
        setStatus('error')
        setMessage((body.errors && body.errors[0]) || 'Er ging iets mis. Probeer het opnieuw.')
      }
    } catch {
      setStatus('error')
      setMessage('Er ging iets mis. Probeer het opnieuw.')
    }
  }

  if (status === 'ok') {
    return (
      <div className="form-success" role="status" aria-live="polite">
        <span className="form-success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <p className="form-success-text">{message}</p>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="form" noValidate>
      {def.fields.map((f) => {
        if (f.fieldType === 'hidden') {
          return <input key={f.name} type="hidden" name={f.name} defaultValue={f.placeholder || ''} />
        }
        const err = fieldErrors[f.name]
        const errId = err ? `${slug}-${f.name}-error` : undefined
        // Fout wissen zodra de bezoeker het veld corrigeert.
        const clear = () => { if (fieldErrors[f.name]) setFieldErrors((p) => { const n = { ...p }; delete n[f.name]; return n }) }
        const common = {
          name: f.name,
          required: !!f.required,
          'aria-invalid': err ? true : undefined,
          'aria-describedby': errId,
        } as const
        return (
          <label key={f.name} className={`form-field${err ? ' form-field--error' : ''}`}>
            <span className="form-label">{f.label}{f.required ? ' *' : ''}</span>
            {f.fieldType === 'textarea' ? (
              <textarea {...common} placeholder={f.placeholder || ''} onInput={clear} />
            ) : f.fieldType === 'select' ? (
              <select {...common} defaultValue="" onChange={clear}>
                <option value="" disabled>{f.placeholder || 'Kies…'}</option>
                {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            ) : f.fieldType === 'checkbox' ? (
              <input type="checkbox" {...common} onChange={clear} />
            ) : (
              <input type={f.fieldType} {...common} placeholder={f.placeholder || ''} onInput={clear} />
            )}
            {err && <span className="form-field-error" id={errId} role="alert">{err}</span>}
          </label>
        )
      })}
      {status === 'error' && <p className="form-error">{message}</p>}
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Versturen…' : def.submitLabel || 'Versturen'}
      </button>
    </form>
  )
}
