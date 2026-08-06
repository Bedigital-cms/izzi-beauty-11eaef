/**
 * GET /api/commerce/order-status?order=IZZI-2026-00042&token=…
 *
 * Betaalstatus voor de bedankpagina. Die pagina pollt dit endpoint omdat Mollie de klant terugstuurt
 * vóórdat de webhook binnen kan zijn (zie PaymentStatus.tsx).
 */
import { getOrderStatus } from '@/lib/commerce/client'
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
  const orderNumber = url.searchParams.get('order')?.trim()
  const token = url.searchParams.get('token')?.trim()

  // Het bestelnummer is oplopend en dus te raden; het token is het eigenlijke toegangsbewijs.
  if (!orderNumber || !token) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  const result = await getOrderStatus(orderNumber, token)
  if (!result.ok) return json({ ok: false, error: 'Niet gevonden.' }, 404)

  return json({ ok: true, data: result.data })
}
