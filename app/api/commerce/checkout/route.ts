/**
 * POST /api/commerce/checkout — start het afrekenen en geeft de Mollie-betaalpagina terug.
 *
 * De browser stuurt hier het bedrag mee dat op het SCHERM stond. Dat is puur een controle: komt het
 * niet overeen met wat het CMS berekent, dan krijgt de bezoeker het nieuwe totaal te zien vóórdat hij
 * betaalt. Er wordt nooit stilzwijgend een ander bedrag afgerekend.
 *
 * `Idempotency-Key` wordt hier gegenereerd (niet door de browser): zo levert een dubbelgeklikte knop
 * hetzelfde antwoord op in plaats van een tweede bestelling en een tweede betaling.
 */
import { randomUUID } from 'node:crypto'

import { getCart, startCheckout } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import { readCartToken } from '@/lib/commerce/session'
import { defaultLocale, isActiveLocale } from '@/lib/i18n'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export async function POST(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  // CSRF: een muterend verzoek moet van deze site komen.
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

  const token = await readCartToken()
  if (!token) return json({ ok: false, error: 'Je winkelwagen is leeg.' }, 400)

  const body = (await request.json().catch(() => ({}))) as {
    expectedTotalCents?: number
    method?: string | null
    customerNote?: string
    /** Idempotency-sleutel van een eerdere poging, zodat opnieuw proberen niet dubbel bestelt. */
    idempotencyKey?: string
  }

  // Voor de zekerheid: bestaat de winkelwagen nog en zit er iets in?
  const cart = await getCart(token)
  if (!cart.ok) return json({ ok: false, error: 'Je winkelwagen is niet meer beschikbaar.' }, 400)
  if (cart.data.cart.itemCount === 0) return json({ ok: false, error: 'Je winkelwagen is leeg.' }, 400)

  /*
   * Waar Mollie de klant naartoe terugstuurt. Het CMS controleert dat deze host bij de tenant hoort
   * (anders zou dit een open redirect zijn).
   *
   * De taal komt uit de Referer: dit is een API-route en die zit niet onder `app/[locale]/`, dus er
   * is hier geen `params.locale`. Zonder dat segment kwam de klant na het betalen op een pad zonder
   * taal uit — en na het hernoemen van de winkelroutes naar Nederlandse namen was `/checkout/bedankt`
   * ook nog eens een route die niet meer bestaat. Beide kanten van dat probleem zaten in één regel.
   *
   * Terugval op de standaardtaal als de Referer ontbreekt of niet te parsen is: een bedankpagina in
   * de verkeerde taal is vervelend, een mislukte redirect na een geslaagde betaling is erger.
   */
  const siteOrigin = new URL(request.url).origin
  const localeFromReferer = (() => {
    try {
      const ref = request.headers.get('referer')
      if (!ref) return null
      const seg = new URL(ref).pathname.split('/').filter(Boolean)[0]
      return seg && isActiveLocale(seg) ? seg : null
    } catch {
      return null
    }
  })()
  const locale = localeFromReferer ?? defaultLocale()
  const returnUrl = `${siteOrigin}/${locale}/afrekenen/bedankt`

  const result = await startCheckout({
    cartToken: token,
    returnUrl,
    // Verplicht aan CMS-kant: zonder dit bedrag kan een klant worden afgerekend voor een totaal dat
    // hij niet op het scherm zag. De client stuurt het mee; ontbreekt het, dan nemen we het totaal uit
    // de winkelwagen die hierboven toch al is opgehaald. Wijkt dat af van wat het CMS uitrekent, dan
    // komt er een PRICE_CHANGED terug — precies de bedoeling.
    expectedTotalCents: body.expectedTotalCents ?? cart.data.cart.totalCents,
    method: body.method ?? null,
    customerNote: body.customerNote,
    idempotencyKey: body.idempotencyKey || randomUUID(),
  })

  if (!result.ok) {
    // Bedrag gewijzigd: de bezoeker moet het nieuwe totaal zien en opnieuw bevestigen.
    if (result.error.apiCode === 'PRICE_CHANGED') {
      return json(
        {
          ok: false,
          code: 'PRICE_CHANGED',
          error: 'Het totaalbedrag is gewijzigd. Controleer je bestelling.',
          details: result.error.details,
        },
        409,
      )
    }
    if (result.error.apiCode === 'OUT_OF_STOCK') {
      return json(
        {
          ok: false,
          code: 'OUT_OF_STOCK',
          error: 'Niet alles is nog op voorraad.',
          details: result.error.details,
        },
        409,
      )
    }
    /*
     * Het CMS kon bij de betaalprovider niet nagaan wat een eerdere poging op deze winkelwagen gedaan
     * heeft. Zolang dat onbekend is, opent het bewust geen tweede betaling — die zou een dubbele
     * afrekening kunnen worden. Tijdelijk, dus de bezoeker hoort te weten dat opnieuw proberen helpt.
     */
    if (result.error.apiCode === 'PAYMENT_STATUS_UNKNOWN') {
      return json(
        {
          ok: false,
          code: 'PAYMENT_STATUS_UNKNOWN',
          error: 'We konden je vorige betaling even niet controleren. Probeer het over een paar seconden opnieuw.',
          details: result.error.details,
        },
        503,
      )
    }
    return json({ ok: false, error: result.error.message }, 400)
  }

  /*
   * De vorige poging blijkt al betaald: er is niets meer af te rekenen. Het CMS geeft dan `checkoutUrl:
   * null` met `alreadyPaid`, en wij sturen de bezoeker naar de bedankpagina van diezelfde bestelling.
   *
   * Deze route is de enige plek die de bedankpagina-URL kent (hij bouwt hierboven ook de `returnUrl`
   * met de juiste taal erin), dus hier hoort de omzetting. Zo blijft het contract met de client
   * hetzelfde: die krijgt een `checkoutUrl` en stuurt de bezoeker daarheen — of dat Mollie is of de
   * bedankpagina maakt voor hem niet uit.
   */
  const redirectUrl = result.data.alreadyPaid
    ? `${returnUrl}?order=${encodeURIComponent(result.data.orderNumber)}&token=${encodeURIComponent(result.data.accessToken)}`
    : result.data.checkoutUrl

  return json({
    ok: true,
    data: {
      orderNumber: result.data.orderNumber,
      // Het toegangstoken hoort bij deze bestelling; de bedankpagina gebruikt het om de status te
      // pollen en de bestelling te tonen.
      accessToken: result.data.accessToken,
      checkoutUrl: redirectUrl,
      totalCents: result.data.totalCents,
      currency: result.data.currency,
      alreadyPaid: result.data.alreadyPaid ?? false,
      resumed: result.data.resumed ?? false,
    },
  })
}
