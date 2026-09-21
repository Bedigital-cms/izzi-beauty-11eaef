/**
 * GET /api/commerce/product?handle=…
 *
 * Publieke productkaart voor opleidingspagina's (varianten = datum/locatie + prijs + plekken).
 * De browser praat hiermee, nooit rechtstreeks met het CMS — de storefront-sleutel blijft op de
 * server. Geen prerender: deze route is force-dynamic, zodat een statische opleidingspagina tijdens
 * de CMS-validatiebuild geen commerce-API hoeft te halen.
 *
 * Webshop uit of onbekende handle → 404, alsof de route niet bestaat.
 */
import { getProduct } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export async function GET(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  const handle = new URL(request.url).searchParams.get('handle')?.trim() ?? ''
  if (!/^[a-z0-9-]+$/.test(handle)) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  const result = await getProduct(handle)
  if (!result.ok) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  const p = result.data.product
  return json({
    ok: true,
    product: {
      title: p.title,
      slug: p.slug,
      priceCents: p.priceCents,
      currency: p.currency,
      variants: p.variants.map((v) => ({
        id: v.id,
        title: v.title,
        priceCents: v.priceCents,
        available: v.available,
        inStock: v.inStock,
        options: v.options,
      })),
    },
  })
}
