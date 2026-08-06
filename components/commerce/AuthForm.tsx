'use client'
/**
 * Inloggen, registreren, wachtwoord vergeten, nieuw wachtwoord — plus de CODE-stap die bij twee
 * daarvan hoort. Één component.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM ÉÉN COMPONENT VOOR AL DEZE FORMULIEREN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Ze delen alles wat er misgaat: dezelfde statusmachine (`idle → sending → error`), dezelfde
 * opmaakklassen, dezelfde afhandeling van een 401/403, en dezelfde eis dat een mislukte poging het
 * ingevulde e-mailadres laat staan. Losse componenten betekent evenveel plekken waar dat uit elkaar
 * gaat lopen; de verschillen zitten in welke velden er staan, en dat is precies wat `mode` regelt.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * DE CODE-STAP: DRIE WEGEN KOMEN HIER UIT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *  1. **na registreren** — het account bestaat, maar is nog niet bevestigd (`codeStep = 'activate'`);
 *  2. **na inloggen met een onbevestigd account** — het wachtwoord klopt, alleen de bevestiging mist.
 *     Er gaat meteen een nieuwe code uit, want die uit de registratiemail is vaak al verlopen;
 *  3. **na "wachtwoord vergeten"** — dan vraagt de stap om de code ÉN een nieuw wachtwoord
 *     (`codeStep = 'reset'`).
 *
 * ── Het wachtwoord blijft alleen in het geheugen ───────────────────────────────────────────────
 * Bij (1) en (2) houdt dit component het wachtwoord in state, zodat de bezoeker na de code meteen
 * ingelogd is in plaats van het nog een keer te moeten intypen. Het gaat nergens anders heen: geen
 * cookie, geen localStorage. Herlaadt hij de pagina, dan is het weg — dan activeert de code het account
 * en logt hij daarna gewoon in. Dat is bewust de goedkoopste oplossing die veilig blijft.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * NA HET INLOGGEN EEN HARDE NAVIGATIE, GEEN router.push
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * De sessie zit in een httpOnly-cookie die de SERVER leest. Na het inloggen moet dus alles wat
 * server-side gerenderd is opnieuw: de accountpagina's, het afrekenformulier (met adressen) en de
 * winkelwagen die aan het account gekoppeld is. `window.location.assign` geeft die garantie in één
 * regel; met een client-side navigatie hangt het ervan af of de router-cache al vernieuwd was, en dan
 * krijgt de bezoeker soms nog even zijn uitgelogde pagina te zien.
 */
import * as React from 'react'

import { LocaleLink, useLocaleConfig } from '@/components/LocaleLink'
import { safeNextPath } from '@/lib/commerce/format'
import { localeHref } from '@/lib/href'
import type { ShopUIStrings } from '@/lib/types'

export type AuthMode = 'login' | 'register' | 'forgot' | 'reset'

type Status = 'idle' | 'sending' | 'error' | 'done'

/** Welke variant van de code-stap open staat, of geen. */
type CodeStep = null | 'activate' | 'reset'

/** Zes cijfers, zoals het CMS ze uitgeeft. */
const CODE_LENGTH = 6

/**
 * Wachttijd voor "stuur opnieuw", in seconden.
 *
 * ⚠️ Moet gelijk blijven aan `RESEND_COOLDOWN_SECONDS` in het CMS
 * (`modules/commerce/customers/otp.ts`). De server is de baas — dit getal is alleen de uitleg aan de
 * bezoeker. Staat hier een lagere waarde, dan klikt hij op een knop die de server stil weigert.
 */
const RESEND_COOLDOWN_SECONDS = 60

/**
 * Een wachtwoordveld met een oogje ernaast om het ingetypte wachtwoord te kunnen controleren.
 *
 * ── Waarom dit een eigen component is ─────────────────────────────────────────────────────────────
 * Er zijn twee wachtwoordvelden in dit formulier (het gewone veld bij inloggen/registreren/herstellen
 * en het "nieuw wachtwoord" in de code-stap), en ze horen zich identiek te gedragen. Twee keer dezelfde
 * knop met dezelfde state ernaast schrijven betekent dat er ooit één van de twee vergeten wordt.
 *
 * ── Waarom `type` wisselt en niet de waarde ergens anders heen gaat ───────────────────────────────
 * Zichtbaar maken is één attribuut omzetten; de input blijft dezelfde input, dus de browser houdt zijn
 * waarde, en een wachtwoordmanager blijft het veld herkennen aan `autoComplete`.
 *
 * ── Toegankelijkheid ─────────────────────────────────────────────────────────────────────────────
 * De knop staat NA de input in de DOM, heeft `tabIndex={-1}` en een `aria-label` die meevertelt wat er
 * gebeurt. Zonder `tabIndex={-1}` komt hij tussen het wachtwoordveld en de verzendknop te staan: wie
 * met Tab en Enter door het formulier gaat, maakt dan zijn wachtwoord zichtbaar in plaats van in te
 * loggen. Met de muis blijft hij gewoon bereikbaar, en `aria-hidden` op het icoon houdt het icoon zelf
 * uit de schermlezer — de label is de tekst.
 */
function PasswordField({
  autoComplete,
  hideLabel,
  id,
  minLength,
  name,
  onChange,
  showLabel,
  value,
}: {
  autoComplete: string
  /** Tooltip als het wachtwoord zichtbaar is ("verbergen"). */
  hideLabel: string
  id: string
  minLength?: number
  name?: string
  onChange?: (value: string) => void
  /** Tooltip als het wachtwoord verborgen is ("tonen"). */
  showLabel: string
  /** Alleen meegeven voor een gecontroleerd veld; het inlogveld leest via FormData uit. */
  value?: string
}) {
  const [visible, setVisible] = React.useState(false)
  const label = visible ? hideLabel : showLabel

  return (
    <div className="password-field">
      <input
        autoComplete={autoComplete}
        id={id}
        minLength={minLength}
        name={name}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        required
        type={visible ? 'text' : 'password'}
        value={value}
      />
      <button
        aria-label={label}
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        title={label}
        type="button"
      >
        <EyeIcon off={visible} />
      </button>
    </div>
  )
}

/**
 * Het oogje. `off` = het wachtwoord is nu zichtbaar, dus de knop biedt "verbergen" aan — vandaar het
 * doorgestreepte oog. Inline en niet uit een iconenpakket: dit is het enige icoon dat dit formulier
 * nodig heeft, en een pakket erbij halen voor twee paden kost meer dan het oplevert.
 */
const EyeIcon = ({ off }: { off: boolean }) => (
  <svg aria-hidden="true" fill="none" focusable="false" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
    {off ? (
      <>
        <path d="M3 3l18 18" strokeLinecap="round" />
        <path
          d="M10.6 5.2A9.8 9.8 0 0112 5c5 0 9 4.5 9 7 0 .8-.5 1.9-1.4 3M6.5 7.1C4.4 8.5 3 10.6 3 12c0 2.5 4 7 9 7 1.7 0 3.2-.5 4.5-1.3"
          strokeLinecap="round"
        />
        <path d="M9.9 9.9a3 3 0 004.2 4.2" strokeLinecap="round" />
      </>
    ) : (
      <>
        <path d="M3 12c0-2.5 4-7 9-7s9 4.5 9 7-4 7-9 7-9-4.5-9-7z" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
)

export function AuthForm({
  mode,
  ui,
  next,
  token,
  /** Compacte variant zonder eigen kop, voor het inlogblok in het afrekenformulier. */
  compact = false,
  /** Wat er na een geslaagde inlog moet gebeuren; standaard doorsturen naar `next`. */
  onSuccess,
}: {
  mode: AuthMode
  ui: ShopUIStrings
  next?: string
  token?: string
  compact?: boolean
  onSuccess?: () => void
}) {
  const { locale, defaultLocale, hideDefaultPrefix } = useLocaleConfig()
  const [status, setStatus] = React.useState<Status>('idle')
  const [message, setMessage] = React.useState('')
  const [notice, setNotice] = React.useState('')

  /** De code-stap: welke variant, en voor welk adres. */
  const [codeStep, setCodeStep] = React.useState<CodeStep>(null)
  const [pendingEmail, setPendingEmail] = React.useState('')
  /** Alleen in het geheugen, zie de toelichting bovenaan. */
  const [pendingPassword, setPendingPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [resending, setResending] = React.useState(false)
  /**
   * Seconden tot "stuur opnieuw" weer mag.
   *
   * Het CMS staat maximaal één code per minuut per adres toe (en vijf per uur). Zonder deze aftelling
   * ziet de bezoeker daar niets van: hij klikt, krijgt "de code is onderweg", en er komt niets — want
   * de server heeft de aanvraag stil geweigerd. Dat antwoord is met opzet altijd hetzelfde (anders
   * verklapt het of er een account bestaat), dus de uitleg hoort hier te staan.
   */
  const [resendIn, setResendIn] = React.useState(0)

  /** Eén interval voor de aftelling; stopt zichzelf op nul. */
  React.useEffect(() => {
    if (resendIn <= 0) return
    const timer = setInterval(() => setResendIn((s) => (s <= 1 ? 0 : s - 1)), 1000)
    return () => clearInterval(timer)
  }, [resendIn])

  const busy = status === 'sending'

  const goAfterLogin = () => {
    if (onSuccess) {
      onSuccess()
      return
    }
    window.location.assign(localeHref(locale, safeNextPath(next), { defaultLocale, hideDefaultPrefix }))
  }

  /** Eén plek voor alle verzoeken naar de eigen auth-route. */
  async function post(action: string, payload: Record<string, unknown>) {
    const res = await fetch(`/api/commerce/auth?action=${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    })
    return (await res.json().catch(() => null)) as {
      ok?: boolean
      error?: string
      code?: string
      data?: { message?: string; email?: string; needsLogin?: boolean }
    } | null
  }

  // ── Stap 1: het gewone formulier ──────────────────────────────────────────────────────────────
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setMessage('')
    setNotice('')

    const data = new FormData(e.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const password = String(data.get('password') ?? '')

    let result: Awaited<ReturnType<typeof post>> = null
    try {
      if (mode === 'reset') {
        result = await post('reset', { token: token ?? '', password })
      } else if (mode === 'forgot') {
        result = await post('forgot', { email })
      } else if (mode === 'register') {
        result = await post('register', {
          email,
          password,
          firstName: String(data.get('firstName') ?? ''),
          lastName: String(data.get('lastName') ?? ''),
          phone: String(data.get('phone') ?? ''),
          acceptsMarketing: data.get('acceptsMarketing') === 'on',
        })
      } else {
        result = await post('login', { email, password })
      }
    } catch {
      setStatus('error')
      setMessage(ui.genericError)
      return
    }

    // Inloggen met een account dat nog bevestigd moet worden: naar de code-stap, met een verse code.
    if (mode === 'login' && result?.code === 'unverified') {
      setPendingEmail(email)
      setPendingPassword(password)
      setCodeStep('activate')
      setStatus('idle')
      void resend(email)
      return
    }

    if (!result?.ok) {
      setStatus('error')
      setMessage(result?.error ?? ui.genericError)
      return
    }

    if (mode === 'register') {
      setPendingEmail(result.data?.email ?? email)
      setPendingPassword(password)
      setCodeStep('activate')
      setStatus('idle')
      setNotice(result.data?.message ?? ui.codeSentText)
      // De registratiemail is net verstuurd; de server weigert een tweede code binnen de wachttijd.
      setResendIn(RESEND_COOLDOWN_SECONDS)
      return
    }

    if (mode === 'forgot') {
      // Herstel: de code komt per mail; de volgende stap vraagt code + nieuw wachtwoord.
      setPendingEmail(email)
      setCodeStep('reset')
      setStatus('idle')
      setNotice(result.data?.message ?? ui.codeSentText)
      return
    }

    if (mode === 'reset') {
      setStatus('done')
      setMessage(result.data?.message ?? '')
      return
    }

    goAfterLogin()
  }

  // ── Stap 2: de code ───────────────────────────────────────────────────────────────────────────
  async function onCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setMessage('')
    setNotice('')

    let result: Awaited<ReturnType<typeof post>> = null
    try {
      result =
        codeStep === 'reset'
          ? await post('reset', { email: pendingEmail, code, password: newPassword })
          : await post('verify', {
              email: pendingEmail,
              code,
              // Alleen meesturen als we het nog hebben; anders activeert dit het account zonder sessie.
              ...(pendingPassword ? { password: pendingPassword } : {}),
            })
    } catch {
      setStatus('error')
      setMessage(ui.genericError)
      return
    }

    if (!result?.ok) {
      setStatus('error')
      setMessage(result?.error ?? ui.genericError)
      // Verlopen of te vaak fout: de code is dood, dus het veld leegmaken en "stuur opnieuw" aanbieden.
      if (result?.code === 'expired' || result?.code === 'too_many_attempts') setCode('')
      return
    }

    if (codeStep === 'reset') {
      setStatus('done')
      setMessage(result.data?.message ?? '')
      return
    }

    // Geactiveerd maar geen sessie (wachtwoord niet meer in het geheugen): laat hem inloggen.
    if (result.data?.needsLogin) {
      setStatus('done')
      setMessage(ui.accountActivated)
      return
    }

    goAfterLogin()
  }

  /** Nieuwe code aanvragen. Het antwoord is altijd hetzelfde, ook bij een onbekend adres. */
  async function resend(email = pendingEmail) {
    setResending(true)
    setMessage('')
    try {
      const result = await post('resend', { email })
      setNotice(result?.data?.message ?? ui.codeSentText)
    } catch {
      setNotice(ui.codeSentText)
    }
    setResending(false)
    setResendIn(RESEND_COOLDOWN_SECONDS)
  }

  // ── Afgeronde stap: het formulier heeft zijn werk gedaan ─────────────────────────────────────
  if (status === 'done') {
    return (
      <div className="auth-card">
        <p className="auth-done" role="status">
          {message}
        </p>
        <LocaleLink className="btn btn-gold" href="/account/inloggen">
          {ui.login}
        </LocaleLink>
      </div>
    )
  }

  // ── De code-stap ─────────────────────────────────────────────────────────────────────────────
  if (codeStep) {
    return (
      <form className={`form auth-card${compact ? ' auth-card--compact' : ''}`} noValidate onSubmit={onCodeSubmit}>
        {!compact && <h2 className="auth-title">{ui.codeTitle}</h2>}
        <p className="auth-intro">
          {ui.codeIntro} <strong>{pendingEmail}</strong>
        </p>

        {notice && (
          <p className="form-saved" role="status">
            {notice}
          </p>
        )}

        <div className="form-field form-field--code">
          <label className="form-label" htmlFor="auth-code">
            {ui.codeLabel}
          </label>
          <input
            /* `one-time-code` laat iOS en Android de code uit de mail/sms aanbieden boven het
               toetsenbord — het verschil tussen overtypen en één tik. `inputMode numeric` geeft een
               cijfertoetsenbord. */
            autoComplete="one-time-code"
            className="code-input"
            id="auth-code"
            inputMode="numeric"
            maxLength={CODE_LENGTH}
            name="code"
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH))}
            pattern="[0-9]*"
            required
            type="text"
            value={code}
          />
          <span className="form-hint">{ui.codeHint}</span>
        </div>

        {/* Bij herstel hoort het nieuwe wachtwoord in dezelfde stap: één keer invullen, één verzoek. */}
        {codeStep === 'reset' && (
          <div className="form-field">
            <label className="form-label" htmlFor="auth-newpassword">
              {ui.newPassword}
            </label>
            <PasswordField
              autoComplete="new-password"
              hideLabel={ui.passwordHide}
              id="auth-newpassword"
              minLength={8}
              onChange={setNewPassword}
              showLabel={ui.passwordShow}
              value={newPassword}
            />
            <span className="form-hint">{ui.passwordHint}</span>
          </div>
        )}

        {status === 'error' && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}

        <button className="btn btn-gold auth-submit" disabled={busy || code.length < CODE_LENGTH} type="submit">
          {/* Twee acties op dezelfde knop: bij herstel wordt een wachtwoord opgeslagen, bij activeren
              wordt alleen de code gecontroleerd. Dus ook twee bezig-teksten. */}
          {busy
            ? codeStep === 'reset'
              ? ui.saving
              : ui.verifyingCode
            : codeStep === 'reset'
              ? ui.resetSubmit
              : ui.codeSubmit}
        </button>

        <div className="auth-links">
          {/* "Stuur opnieuw" alleen bij activeren: bij herstel loopt dat via het herstelformulier, en
              twee knoppen die allebei een code mailen is een uitnodiging om de verkeerde te kiezen. */}
          {codeStep === 'activate' && (
            <button
              className="link-button"
              disabled={resending || resendIn > 0}
              onClick={() => void resend()}
              type="button"
            >
              {resending ? ui.sendingCode : resendIn > 0 ? `${ui.codeResend} (${resendIn}s)` : ui.codeResend}
            </button>
          )}
          {codeStep === 'reset' && <LocaleLink href="/account/wachtwoord-vergeten">{ui.codeResend}</LocaleLink>}
        </div>
      </form>
    )
  }

  const title =
    mode === 'login'
      ? ui.loginTitle
      : mode === 'register'
        ? ui.registerTitle
        : mode === 'forgot'
          ? ui.forgotTitle
          : ui.resetTitle

  const intro =
    mode === 'login'
      ? ui.loginIntro
      : mode === 'register'
        ? ui.registerIntro
        : mode === 'forgot'
          ? ui.forgotIntro
          : ui.resetIntro

  const submitLabel =
    mode === 'login'
      ? ui.login
      : mode === 'register'
        ? ui.register
        : mode === 'forgot'
          ? ui.forgotSubmit
          : ui.resetSubmit

  /*
   * Wat er op de knop staat terwijl het verzoek loopt — per modus, want dit is één knop voor vier
   * verschillende handelingen. "Bezig…" liet de bezoeker in het midden of hij nu inlogde, een account
   * aanmaakte of een code kreeg toegestuurd, en juist bij `forgot` is dat het verschil: daar gebeurt
   * niets op het scherm behalve dat er een e-mail onderweg is.
   */
  const busyLabel =
    mode === 'login'
      ? ui.loggingIn
      : mode === 'register'
        ? ui.registering
        : mode === 'forgot'
          ? ui.sendingCode
          : ui.saving

  return (
    <form className={`form auth-card${compact ? ' auth-card--compact' : ''}`} noValidate onSubmit={onSubmit}>
      {!compact && (
        <>
          <h2 className="auth-title">{title}</h2>
          <p className="auth-intro">{intro}</p>
        </>
      )}

      {mode === 'register' && (
        <div className="address-grid">
          <div className="form-field">
            <label className="form-label" htmlFor="auth-firstName">
              {ui.firstName}
            </label>
            <input autoComplete="given-name" id="auth-firstName" name="firstName" type="text" />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="auth-lastName">
              {ui.lastName}
            </label>
            <input autoComplete="family-name" id="auth-lastName" name="lastName" type="text" />
          </div>
        </div>
      )}

      {mode !== 'reset' && (
        <div className="form-field">
          <label className="form-label" htmlFor="auth-email">
            {ui.email}
          </label>
          <input autoComplete="email" id="auth-email" name="email" required type="email" />
        </div>
      )}

      {mode === 'register' && (
        <div className="form-field">
          <label className="form-label" htmlFor="auth-phone">
            {ui.phone}
          </label>
          <input autoComplete="tel" id="auth-phone" name="phone" type="tel" />
        </div>
      )}

      {mode !== 'forgot' && (
        <div className="form-field">
          <label className="form-label" htmlFor="auth-password">
            {mode === 'reset' ? ui.newPassword : ui.password}
          </label>
          <PasswordField
            /* `new-password` bij registreren en herstellen: dan biedt de browser een nieuw wachtwoord
               aan in plaats van het oude in te vullen. */
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            hideLabel={ui.passwordHide}
            id="auth-password"
            minLength={mode === 'login' ? undefined : 8}
            name="password"
            showLabel={ui.passwordShow}
          />
          {mode !== 'login' && <span className="form-hint">{ui.passwordHint}</span>}
        </div>
      )}

      {mode === 'register' && (
        <label className="form-check">
          <input name="acceptsMarketing" type="checkbox" />
          <span>{ui.marketingOptIn}</span>
        </label>
      )}

      {mode === 'register' && <p className="form-hint">{ui.registerCodeNote}</p>}

      {status === 'error' && (
        <p className="form-error" role="alert">
          {message}
        </p>
      )}

      <button className="btn btn-gold auth-submit" disabled={busy} type="submit">
        {busy ? busyLabel : submitLabel}
      </button>

      {/* Doorverwijzingen. In de compacte variant alleen "wachtwoord vergeten": de rest van de
          keuzes staat op het afrekenformulier zelf. */}
      <div className="auth-links">
        {mode === 'login' && (
          <>
            <LocaleLink href="/account/wachtwoord-vergeten">{ui.forgotPassword}</LocaleLink>
            {!compact && (
              <span>
                {ui.noAccountYet}{' '}
                <LocaleLink href={next ? `/account/registreren?next=${encodeURIComponent(next)}` : '/account/registreren'}>
                  {ui.register}
                </LocaleLink>
              </span>
            )}
          </>
        )}
        {mode === 'register' && (
          <span>
            {ui.alreadyHaveAccount}{' '}
            <LocaleLink href={next ? `/account/inloggen?next=${encodeURIComponent(next)}` : '/account/inloggen'}>
              {ui.login}
            </LocaleLink>
          </span>
        )}
        {mode === 'forgot' && <LocaleLink href="/account/inloggen">{ui.backToLogin}</LocaleLink>}
      </div>
    </form>
  )
}
