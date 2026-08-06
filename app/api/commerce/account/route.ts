/**
 * Account-endpoints van DEZE SITE. De browser praat hiermee, nooit rechtstreeks met het CMS.
 *
 * Het sessietoken staat in een httpOnly first-party cookie (`bd_session`) en gaat van hieruit als
 * header naar het CMS. Dus: geen third-party cookie, en het token komt nooit in JavaScript terecht —
 * zelfs een XSS-fout op deze site levert geen leesbaar sessietoken op.
 *
 * GET   → `{ customer, addresses }` — `customer: null` als er niemand is ingelogd
 * PATCH → profiel bijwerken (voornaam, achternaam, telefoon, nieuwsbrief)
 *
 * Het adresboek zelf (toevoegen/wijzigen/verwijderen) zit in `account/addresses/route.ts`.
 */
import { getCustomer, getCustomerAddresses, updateCustomer } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import { readSessionToken } from '@/lib/commerce/session'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

/** Muterende verzoeken moeten van deze site komen. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // geen Origin = geen browserverzoek van een andere site
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export async function GET(): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  const token = await readSessionToken()
  if (!token) return json({ ok: true, data: { customer: null, addresses: [] } })

  const [profile, addresses] = await Promise.all([getCustomer(token), getCustomerAddresses(token)])

  // Token verlopen of ingetrokken → als "niet ingelogd" behandelen. De cookie opruimen gebeurt bij de
  // logout-actie: een GET mag geen cookies zetten.
  if (!profile.ok) return json({ ok: true, data: { customer: null, addresses: [] } })

  return json({
    ok: true,
    data: {
      customer: profile.data.customer,
      addresses: addresses.ok ? addresses.data.addresses : [],
    },
  })
}

export async function PATCH(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)
  if (!sameOrigin(request)) return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)

  const token = await readSessionToken()
  if (!token) return json({ ok: false, error: 'Je bent niet (meer) ingelogd.' }, 401)

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>

  /*
   * Bewust NIET bij te werken: e-mailadres (dat is de inlognaam) en wachtwoord (eigen flow met een
   * bevestiging per mail). Alles wat hier niet in de lijst staat, negeert het CMS ook — maar het is
   * beter dat deze kant het ook niet dóórstuurt.
   */
  const patch: Record<string, unknown> = {}
  if (typeof body.firstName === 'string') patch.firstName = body.firstName
  if (typeof body.lastName === 'string') patch.lastName = body.lastName
  if (typeof body.phone === 'string') patch.phone = body.phone
  if (typeof body.acceptsMarketing === 'boolean') patch.acceptsMarketing = body.acceptsMarketing
  /*
   * De code uit de mail. Ontbreekt hij, dan is dit stap 1: het CMS slaat niets op en mailt een code.
   * Deze route bewaart de nieuwe waarden dus NIET tussen de twee stappen — dat doet het formulier in de
   * browser. Eén plek waar een half opgeslagen wijziging kan staan, is één plek te veel.
   */
  if (typeof body.code === 'string' && body.code.trim()) patch.code = body.code.trim()

  if (!Object.keys(patch).length) return json({ ok: false, error: 'Niets om bij te werken.' }, 400)

  const result = await updateCustomer(token, patch)
  if (!result.ok) {
    return json(
      {
        ok: false,
        error: result.error.message,
        code: (result.error.details as { reason?: string } | undefined)?.reason,
      },
      result.error.status === 401 || result.error.status === 429 ? result.error.status : 400,
    )
  }

  return json({ ok: true, data: result.data })
}
