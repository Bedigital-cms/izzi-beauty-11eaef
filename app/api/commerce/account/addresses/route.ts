/**
 * Adresboek van de ingelogde klant — endpoints van DEZE SITE.
 *
 * POST   → adres toevoegen
 * PATCH  → adres wijzigen (`{ id, ...velden }`)
 * DELETE → adres verwijderen (`?id=…`)
 *
 * Het id komt uit de body/query, maar de EIGENAAR nooit: die haalt het CMS uit het sessietoken en
 * zet hem in de query van zijn eigen zoekopdracht. Een geraden id levert daarom hetzelfde antwoord
 * op als een id dat niet bestaat.
 */
import {
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
  type AddressPayload,
} from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import { readSessionToken } from '@/lib/commerce/session'

export const dynamic = 'force-dynamic'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    return new URL(origin).host === new URL(request.url).host
  } catch {
    return false
  }
}

/**
 * Welke status deze route teruggeeft bij een fout van het CMS.
 *
 * ── Waarom niet alles 400 ─────────────────────────────────────────────────────────────────────
 * Dat deed deze route eerst, en dan is in de netwerktab en in de logs niet meer te zien wát er aan de
 * hand was: een afgekeurd veld (400), een verlopen sessie (401) of te veel pogingen (429) kwamen er
 * alle drie uit als 400. De MELDING was wel juist, maar de status is waar een monitoringtool naar kijkt.
 */
const statusFor = (cmsStatus?: number): number =>
  cmsStatus === 401 || cmsStatus === 403 || cmsStatus === 429 ? cmsStatus : 400

const COUNTRIES = ['NL', 'BE', 'DE'] as const

/** Alleen de velden die een adres kent, en alleen als tekst. Alles daarbuiten gaat niet mee. */
function readAddress(body: Record<string, unknown>): AddressPayload {
  const text = (value: unknown, max: number): string | undefined =>
    typeof value === 'string' ? value.trim().slice(0, max) : undefined

  const country = typeof body.country === 'string' ? body.country.toUpperCase() : ''

  return {
    label: text(body.label, 60),
    firstName: text(body.firstName, 100),
    lastName: text(body.lastName, 100),
    company: text(body.company, 150),
    street: text(body.street, 200),
    houseNumber: text(body.houseNumber, 20),
    houseNumberAddition: text(body.houseNumberAddition, 20),
    postalCode: text(body.postalCode, 20),
    city: text(body.city, 100),
    country: (COUNTRIES as readonly string[]).includes(country)
      ? (country as (typeof COUNTRIES)[number])
      : undefined,
    phone: text(body.phone, 40),
  }
}

/**
 * Een adres zonder straat of plaats is geen adres — dat vangen we hier, vóór het CMS.
 *
 * Alleen de AANWEZIGHEID, niet de vorm. De postcodevorm hangt van het land af en die regel staat in het
 * CMS (`modules/commerce/customers/addresses.ts`); hem hier nog een keer opschrijven levert twee regels
 * op die uit elkaar gaan lopen, en dan wordt een adres geweigerd met een melding die niet klopt.
 */
function missingRequired(address: AddressPayload): boolean {
  return !address.street || !address.houseNumber || !address.postalCode || !address.city
}

export async function POST(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)
  if (!sameOrigin(request)) return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)

  const token = await readSessionToken()
  if (!token) return json({ ok: false, error: 'Je bent niet (meer) ingelogd.' }, 401)

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const address = readAddress(body)
  if (missingRequired(address)) {
    return json({ ok: false, error: 'Vul straat, huisnummer, postcode en plaats in.' }, 400)
  }

  const result = await createCustomerAddress(token, address)
  if (!result.ok) return json({ ok: false, error: result.error.message }, statusFor(result.error.status))

  return json({ ok: true, data: { address: result.data.address } })
}

export async function PATCH(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)
  if (!sameOrigin(request)) return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)

  const token = await readSessionToken()
  if (!token) return json({ ok: false, error: 'Je bent niet (meer) ingelogd.' }, 401)

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = body.id
  if (id === undefined || id === null || id === '') {
    return json({ ok: false, error: 'Geen adres opgegeven.' }, 400)
  }

  const address = readAddress(body)
  if (missingRequired(address)) {
    return json({ ok: false, error: 'Vul straat, huisnummer, postcode en plaats in.' }, 400)
  }

  const result = await updateCustomerAddress(token, String(id), address)
  if (!result.ok) return json({ ok: false, error: result.error.message }, statusFor(result.error.status))

  return json({ ok: true, data: { address: result.data.address } })
}

export async function DELETE(request: Request): Promise<Response> {
  if (!commerceEnabled()) return json({ ok: false, error: 'Niet gevonden.' }, 404)
  if (!sameOrigin(request)) return json({ ok: false, error: 'Ongeldig verzoek.' }, 403)

  const token = await readSessionToken()
  if (!token) return json({ ok: false, error: 'Je bent niet (meer) ingelogd.' }, 401)

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return json({ ok: false, error: 'Geen adres opgegeven.' }, 400)

  const result = await deleteCustomerAddress(token, id)
  if (!result.ok) return json({ ok: false, error: result.error.message }, statusFor(result.error.status))

  return json({ ok: true, data: { deleted: true } })
}
