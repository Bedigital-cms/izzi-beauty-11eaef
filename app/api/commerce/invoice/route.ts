/**
 * GET /api/commerce/invoice?order=…&token=… — de factuur-PDF van een bestelling.
 *
 * Deze route zet de PDF van het CMS rechtstreeks door naar de browser. Reden om hem niet in de pagina
 * te bouwen: de sleutel van de webshop-API mag de browser nooit zien, en de PDF wordt aan de CMS-kant
 * gemaakt uit dezelfde gegevens als de mailbijlage — dus er is niets om hier te doen behalve doorgeven.
 *
 * ── Het token blijft server-side niet nodig, maar mag wel ─────────────────────────────────────
 * De klant komt hier met het `accessToken` van zijn bestelling, hetzelfde bewijs waarmee hij zijn
 * bestelpagina opent. Dat is bewust: zo werkt de download ook voor een GAST zonder account, precies
 * zoals de link in zijn bestelmail.
 */
import { getInvoicePdf } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'

export const dynamic = 'force-dynamic'

const notFound = () =>
  new Response(JSON.stringify({ ok: false, error: 'Niet gevonden.' }), {
    status: 404,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

export async function GET(request: Request): Promise<Response> {
  if (!commerceEnabled()) return notFound()

  const url = new URL(request.url)
  const orderNumber = url.searchParams.get('order')?.trim() ?? ''
  const token = url.searchParams.get('token')?.trim() ?? ''

  if (!orderNumber || !token) return notFound()

  const result = await getInvoicePdf(orderNumber, token)

  /*
   * Elke fout wordt hier een 404. Het CMS onderscheidt "bestaat niet" en "kon niet gemaakt worden", maar
   * voor de bezoeker is het verschil niet bruikbaar — en een bestelnummer is raadbaar, dus hoe minder
   * dit endpoint over andermans bestellingen prijsgeeft, hoe beter.
   */
  if (!result.ok) return notFound()

  return new Response(new Uint8Array(result.data.pdf), {
    status: 200,
    headers: {
      'content-type': 'application/pdf',
      'content-length': String(result.data.pdf.length),
      'content-disposition': `attachment; filename="${result.data.fileName}"`,
      'cache-control': 'no-store',
    },
  })
}
