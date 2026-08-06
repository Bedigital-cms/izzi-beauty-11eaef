/**
 * Klant-authenticatie van DEZE SITE.
 *
 * Het CMS geeft een token terug als JSON; deze route zet dat token in een eigen first-party cookie.
 * Zo is er nooit een third-party cookie nodig (die door Safari, Firefox en Chrome geblokkeerd wordt)
 * en komt het token niet in JavaScript terecht.
 *
 * POST   ?action=login|register|verify|resend|logout|forgot|reset
 * GET                                        → profiel van de ingelogde klant
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * REGISTREREN LEVERT GEEN SESSIE OP — DE CODE DOET DAT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `register` maakt het account aan en laat het CMS een code van zes cijfers mailen; `verify` wisselt die
 * code in voor een sessie. Daardoor is het e-mailadres van elk account gecontroleerd: een typefout wordt
 * meteen zichtbaar (er komt geen code) in plaats van pas bij de eerste bestelbevestiging die nergens
 * aankomt.
 *
 * Het WACHTWOORD gaat bij `verify` nog één keer mee, alleen om de bezoeker meteen ingelogd verder te
 * laten gaan. Deze route bewaart het niet: het gaat rechtstreeks door naar het CMS en verder nergens
 * heen. Ontbreekt het (pagina herladen), dan activeert `verify` het account zonder sessie en logt de
 * bezoeker daarna zelf in.
 */
import {
  getCustomer,
  loginCustomer,
  registerCustomer,
  requestPasswordReset,
  resendRegistrationCode,
  resetPassword,
  resetPasswordWithCode,
  verifyRegistration,
} from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import {
  clearSessionToken,
  readCartToken,
  readSessionToken,
  writeSessionToken,
} from '@/lib/commerce/session'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export async function GET(): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  const token = await readSessionToken()
  if (!token) return json({ ok: true, data: { customer: null } })

  const result = await getCustomer(token)
  if (!result.ok) {
    // Token verlopen of ingetrokken: als "niet ingelogd" behandelen. De cookie opruimen kan hier niet
    // (GET mag geen cookies zetten in een cacheable respons), dus dat doet de logout-actie.
    return json({ ok: true, data: { customer: null } })
  }
  return json({ ok: true, data: { customer: result.data.customer } })
}

export async function POST(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  // CSRF: muterende verzoeken moeten van deze site komen.
  const origin = request.headers.get('origin')
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)
      }
    } catch {
      return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)
    }
  }

  const action = new URL(request.url).searchParams.get('action')
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  if (action === 'logout') {
    await clearSessionToken()
    return json({ ok: true, data: { customer: null } })
  }

  // ── Registreren: account aanmaken, code onderweg ────────────────────────────────────────────
  if (action === 'register') {
    const email = String(body.email ?? '').trim()
    const password = String(body.password ?? '')
    if (!email || !password) {
      return json({ ok: false, error: 'Vul je e-mailadres en wachtwoord in.' }, 400)
    }

    const result = await registerCustomer({
      email,
      password,
      firstName: body.firstName ? String(body.firstName) : undefined,
      lastName: body.lastName ? String(body.lastName) : undefined,
      phone: body.phone ? String(body.phone) : undefined,
      acceptsMarketing: body.acceptsMarketing === true,
    })

    if (!result.ok) return json({ ok: false, error: result.error.message }, 400)

    return json({
      ok: true,
      data: { needsVerification: true, email: result.data.email, message: result.data.message },
    })
  }

  // ── Code verzilveren: account actief + sessie ───────────────────────────────────────────────
  if (action === 'verify') {
    const email = String(body.email ?? '').trim()
    const code = String(body.code ?? '').trim()
    if (!email || !code) return json({ ok: false, error: 'Vul de code in die we je gemaild hebben.' }, 400)

    // Gastwinkelwagen meesturen zodat de bezoeker zijn selectie houdt.
    const cartToken = (await readCartToken()) ?? undefined

    const result = await verifyRegistration({
      email,
      code,
      password: body.password ? String(body.password) : undefined,
      cartToken,
    })

    if (!result.ok) {
      return json(
        {
          ok: false,
          error: result.error.message,
          // `expired` / `too_many_attempts` / `invalid` — de UI biedt op de eerste twee "stuur opnieuw" aan.
          code: (result.error.details as { reason?: string } | undefined)?.reason,
        },
        // Een 429 van het CMS blijft een 429: dat is "te veel pogingen", niet "verkeerde invoer". Zou
        // dat hier een 400 worden, dan is in de logs (en voor een monitoringtool) niet meer te zien of
        // iemand zit te bruteforcen of gewoon een typefout maakt.
        result.error.status === 429 ? 429 : 400,
      )
    }

    // Geen wachtwoord meegestuurd → account geactiveerd, maar de bezoeker moet zelf inloggen.
    if (!result.data.token) {
      return json({ ok: true, data: { verified: true, customer: null, needsLogin: true } })
    }

    await writeSessionToken(result.data.token, result.data.expiresAt)
    return json({ ok: true, data: { verified: true, customer: result.data.customer } })
  }

  if (action === 'resend') {
    const email = String(body.email ?? '').trim()
    const result = await resendRegistrationCode(email)
    // Antwoord is met opzet altijd hetzelfde, ook bij een onbekend adres.
    return json({
      ok: true,
      data: {
        message: result.ok
          ? result.data.message
          : 'Als er een account op dit adres wacht op bevestiging, is de code onderweg.',
      },
    })
  }

  if (action === 'login') {
    const email = String(body.email ?? '').trim()
    const password = String(body.password ?? '')
    if (!email || !password) {
      return json({ ok: false, error: 'Vul je e-mailadres en wachtwoord in.' }, 400)
    }

    // Gastwinkelwagen meesturen zodat de bezoeker zijn selectie houdt na het inloggen.
    const cartToken = (await readCartToken()) ?? undefined

    const result = await loginCustomer({ email, password, cartToken })

    if (!result.ok) {
      /*
       * Wachtwoord klopt, e-mailadres nog niet bevestigd. Dit doorgeven als `code: 'unverified'` zodat
       * het formulier naar het codeveld springt — zonder dat blijft de bezoeker een wachtwoord proberen
       * dat gewoon goed is.
       */
      const reason = (result.error.details as { reason?: string } | undefined)?.reason
      if (reason === 'unverified') {
        return json({ ok: false, code: 'unverified', error: result.error.message, data: { email } }, 403)
      }
      return json({ ok: false, error: result.error.message }, result.error.status === 401 ? 401 : 400)
    }

    await writeSessionToken(result.data.token, result.data.expiresAt)
    return json({ ok: true, data: { customer: result.data.customer } })
  }

  if (action === 'forgot') {
    const email = String(body.email ?? '').trim()
    const result = await requestPasswordReset(email)
    // Antwoord is met opzet altijd hetzelfde, ook bij een onbekend adres.
    return json({
      ok: true,
      data: {
        message: result.ok
          ? result.data.message
          : 'Als dit e-mailadres bij ons bekend is, ontvang je een e-mail om je wachtwoord opnieuw in te stellen.',
      },
    })
  }

  /*
   * Nieuw wachtwoord instellen. Twee wegen, want de herstelmail biedt ze beide aan:
   *  - met de CODE (`email` + `code`) — de hoofdweg;
   *  - met het TOKEN uit de knop (`token`) — voor wie liever klikt.
   */
  if (action === 'reset') {
    const password = String(body.password ?? '')
    const code = String(body.code ?? '').trim()
    const email = String(body.email ?? '').trim()
    const token = String(body.token ?? '')

    if (code && email) {
      const result = await resetPasswordWithCode({ email, code, password })
      if (!result.ok) {
        return json(
          {
            ok: false,
            error: result.error.message,
            code: (result.error.details as { reason?: string } | undefined)?.reason,
          },
          // Zie hierboven: te veel pogingen blijft een 429.
          result.error.status === 429 ? 429 : 400,
        )
      }
      return json({ ok: true, data: { message: result.data.message } })
    }

    if (!token) return json({ ok: false, error: 'Vul de code in die we je gemaild hebben.' }, 400)

    const result = await resetPassword(token, password)
    if (!result.ok) return json({ ok: false, error: result.error.message }, 400)
    return json({ ok: true, data: { message: result.data.message } })
  }

  return json({ ok: false, error: 'Onbekende actie.' }, 400)
}
