/**
 * GET /api/commerce/shipping?country=NL&subtotalCents=1999&discountCents=500&weightGrams=250
 *
 * Verzendmethoden voor een land, met het tarief dat bij deze winkelwagen hoort. Het afrekenformulier
 * gebruikt dit om de lijst bij te werken als de bezoeker een ander land kiest.
 *
 * `discountCents` en `weightGrams` bepalen het tarief net zo goed als het subtotaal — een drempel voor
 * gratis verzending geldt ná korting, en een gewichtsstaffel hangt aan het gewicht. Ze horen dus mee
 * te gaan; zonder die twee toonde de lijst een lager bedrag dan er werd afgerekend.
 */
import { getShippingMethods } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export async function GET(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  const url = new URL(request.url)
  const result = await getShippingMethods({
    country: (url.searchParams.get('country') || 'NL').toUpperCase(),
    subtotalCents: Number(url.searchParams.get('subtotalCents') ?? 0) || 0,
    discountCents: Number(url.searchParams.get('discountCents') ?? 0) || 0,
    weightGrams: Number(url.searchParams.get('weightGrams') ?? 0) || 0,
  })

  // Bij een fout een lege lijst: het formulier toont dan "geen methode beschikbaar" in plaats van
  // een technische melding.
  if (!result.ok) return json({ ok: true, data: { methods: [] } })

  return json({ ok: true, data: { methods: result.data.methods } })
}
