/**
 * Winkelwagen-endpoints van DEZE SITE. De browser praat hiermee, nooit rechtstreeks met het CMS.
 *
 * ── Waarom deze tussenlaag ────────────────────────────────────────────────────────────────────
 *  1. **De sleutel blijft op de server.** `COMMERCE_API_KEY` zit alleen in deze route-handlers.
 *  2. **Geen CORS nodig.** Dit is same-origin, dus geen preflight, geen third-party cookies.
 *  3. **De winkelwagen zit in een first-party cookie**, die de browser wél altijd meestuurt.
 *
 * `proxy.ts` sluit `/api/` al uit van de taal-routing, dus deze paden zijn taalneutraal.
 *
 * GET    ?countOnly=1  → alleen het aantal (voor de badge in de header)
 * GET                  → de volledige winkelwagen
 * POST                 → regel toevoegen (maakt een winkelwagen aan als die er nog niet is)
 * POST   ?action=reset → winkelwagen-cookie vergeten (na een betaalde bestelling)
 * PATCH                → aantal wijzigen, korting, adres, verzendmethode
 * DELETE               → regel verwijderen
 *
 * ── Een OMGEZETTE winkelwagen bestaat hier niet ───────────────────────────────────────────────
 * Zodra er betaald is, zet het CMS de wagen op `converted`. Het token staat dan nog in de cookie van
 * de bezoeker, en daar zat een bug: de badge in de header bleef het aantal van de net BETAALDE wagen
 * tonen ("4"), en op /winkelwagen stonden de gekochte artikelen er nog in. Deze route behandelt een
 * omgezette wagen daarom als "geen wagen" en gooit de cookie weg. `?action=reset` doet hetzelfde
 * meteen na een geslaagde betaling, zodat de bezoeker de badge niet eerst op 4 ziet staan.
 */
import { addCartLine, createCart, getCart, removeCartLine, updateCart, updateCartLine } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import { clearCartToken, readCartToken, readSessionToken, writeCartToken } from '@/lib/commerce/session'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

/** Webshop uit → 404, alsof deze route niet bestaat. */
const notFound = () => json({ ok: false, error: 'Niet gevonden.' }, 404)

/**
 * Simpele CSRF-bescherming: bij een muterend verzoek moet de Origin bij deze site horen.
 *
 * De cookie is `sameSite: 'lax'`, dus een cross-site POST stuurt hem al niet mee — maar deze extra
 * controle is één regel en sluit ook het geval af waarin dat ooit verandert.
 */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true // geen Origin = geen browserverzoek van een andere site
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

export async function GET(request: Request): Promise<Response> {
  if (!commerceEnabled()) return notFound()

  const token = await readCartToken()
  const countOnly = new URL(request.url).searchParams.get('countOnly') === '1'

  // Nog geen winkelwagen: geen aanmaken bij het enkel bekijken. Browsen hoort geen lege wagens op te
  // leveren; die ontstaan pas bij de eerste toevoeging.
  if (!token) {
    return json({ ok: true, data: countOnly ? { itemCount: 0 } : { cart: null } })
  }

  const result = await getCart(token)
  if (!result.ok) {
    // Onbekend of verlopen token: als lege winkelwagen behandelen, niet als fout. De bezoeker hoeft
    // niet te weten dat zijn oude token niet meer bestaat.
    return json({ ok: true, data: countOnly ? { itemCount: 0 } : { cart: null } })
  }

  /*
   * Al omgezet in een bestelling (er is betaald). De cookie hier weggooien mag: dit is een route
   * handler met `force-dynamic`, geen gecachete pagina. Zonder dit blijft de bezoeker na het afrekenen
   * de artikelen van zijn betaalde bestelling in zijn winkelwagen zien.
   */
  if (result.data.cart.status === 'converted') {
    await clearCartToken()
    return json({ ok: true, data: countOnly ? { itemCount: 0 } : { cart: null } })
  }

  return json({
    ok: true,
    data: countOnly ? { itemCount: result.data.cart.itemCount } : { cart: result.data.cart },
  })
}

export async function POST(request: Request): Promise<Response> {
  if (!commerceEnabled()) return notFound()
  if (!sameOrigin(request)) return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)

  /*
   * `?action=reset` — de winkelwagen vergeten. Gebruikt door de bedankpagina zodra de betaling
   * vaststaat: het CMS heeft de wagen dan omgezet en de bezoeker hoort een lege badge te zien.
   */
  if (new URL(request.url).searchParams.get('action') === 'reset') {
    await clearCartToken()
    return json({ ok: true, data: { cart: null, itemCount: 0 } })
  }

  const body = (await request.json().catch(() => ({}))) as { variantId?: string | number; quantity?: number }
  if (body.variantId === undefined) {
    return json({ ok: false, error: 'Geen product opgegeven.' }, 400)
  }

  // Ingelogd? Dan koppelt het CMS een nieuwe wagen meteen aan het account — anders belandt de
  // bestelling niet in de bestelgeschiedenis van deze klant.
  const sessionToken = (await readSessionToken()) ?? undefined

  // Winkelwagen aanmaken bij de eerste toevoeging.
  let token = await readCartToken()
  if (!token) {
    const created = await createCart(sessionToken)
    if (!created.ok) {
      return json({ ok: false, error: 'De winkelwagen kon niet worden aangemaakt.' }, 503)
    }
    token = created.data.cart.token
    await writeCartToken(token)
  }

  const result = await addCartLine(token, body.variantId, Math.max(1, Number(body.quantity ?? 1)))

  if (!result.ok) {
    // Winkelwagen intussen verdwenen (opgeruimd of omgezet): één keer opnieuw proberen met een
    // nieuwe wagen, zodat de bezoeker geen onbegrijpelijke fout ziet.
    if (result.error.apiCode === 'NOT_FOUND') {
      const created = await createCart(sessionToken)
      if (created.ok) {
        await writeCartToken(created.data.cart.token)
        const retry = await addCartLine(created.data.cart.token, body.variantId, Math.max(1, Number(body.quantity ?? 1)))
        if (retry.ok) return json({ ok: true, data: { cart: retry.data.cart } })
      }
    }
    return json(
      { ok: false, error: result.error.message, code: result.error.apiCode },
      result.error.apiCode === 'OUT_OF_STOCK' ? 409 : 400,
    )
  }

  return json({ ok: true, data: { cart: result.data.cart } })
}

export async function PATCH(request: Request): Promise<Response> {
  if (!commerceEnabled()) return notFound()
  if (!sameOrigin(request)) return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)

  const token = await readCartToken()
  if (!token) return json({ ok: false, error: 'Geen winkelwagen.' }, 400)

  const body = (await request.json().catch(() => ({}))) as {
    lineId?: string
    quantity?: number
    discountCode?: string | null
    shippingMethodId?: string | number | null
    shippingAddress?: Record<string, unknown>
    billingAddress?: Record<string, unknown>
    email?: string
  }

  // Aantal van één regel wijzigen.
  if (body.lineId !== undefined && body.quantity !== undefined) {
    const result = await updateCartLine(token, body.lineId, Math.max(0, Number(body.quantity)))
    if (!result.ok) return json({ ok: false, error: result.error.message }, 400)
    return json({ ok: true, data: { cart: result.data.cart } })
  }

  // Korting, adres, e-mail of verzendmethode.
  const patch: Parameters<typeof updateCart>[1] = {}
  if ('discountCode' in body) patch.discountCode = body.discountCode ?? null
  if ('shippingMethodId' in body) patch.shippingMethodId = body.shippingMethodId ?? null
  if (body.shippingAddress) patch.shippingAddress = body.shippingAddress
  if (body.billingAddress) patch.billingAddress = body.billingAddress
  if (body.email) patch.email = body.email

  if (!Object.keys(patch).length) return json({ ok: false, error: 'Niets om bij te werken.' }, 400)

  const result = await updateCart(token, patch)
  if (!result.ok) return json({ ok: false, error: result.error.message }, 400)
  return json({ ok: true, data: { cart: result.data.cart } })
}

export async function DELETE(request: Request): Promise<Response> {
  if (!commerceEnabled()) return notFound()
  if (!sameOrigin(request)) return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)

  const token = await readCartToken()
  if (!token) return json({ ok: false, error: 'Geen winkelwagen.' }, 400)

  const lineId = new URL(request.url).searchParams.get('lineId')
  if (!lineId) return json({ ok: false, error: 'Geen regel opgegeven.' }, 400)

  const result = await removeCartLine(token, lineId)
  if (!result.ok) return json({ ok: false, error: result.error.message }, 400)
  return json({ ok: true, data: { cart: result.data.cart } })
}
