/**
 * Wat elke accountpagina nodig heeft: de ingelogde klant, of niets.
 *
 * **Alleen server-side** (leest de sessiecookie via `next/headers`).
 *
 * ── Waarom hier en niet in elke pagina apart ───────────────────────────────────────────────────
 * Vier accountpagina's doen precies hetzelfde: cookie lezen → klant ophalen → is het mislukt, dan naar
 * het inlogformulier met een `?next=` terug naar deze pagina. Dat viermaal uitschrijven is viermaal een
 * kans om de `?next=` te vergeten, en dan komt de bezoeker na het inloggen op de verkeerde pagina uit.
 *
 * ── Een verlopen sessie is "niet ingelogd", geen fout ──────────────────────────────────────────
 * Het token leeft 30 dagen, de cookie precies zo lang. Toch kan het token eerder ongeldig zijn (klant
 * geblokkeerd, `PAYLOAD_SECRET` gewisseld). Dan hoort de bezoeker gewoon het inlogformulier te zien, en
 * geen foutpagina — hij heeft niets verkeerd gedaan.
 */
import {
  getCustomer,
  getCustomerAddresses,
  getCustomerOrders,
  type OrderListFilters,
} from '@/lib/commerce/client'
import { readSessionToken } from '@/lib/commerce/session'
import type { Customer, CustomerAddress, OrderSummary } from '@/lib/commerce/types'

export type AccountSession = {
  token: string
  customer: Customer
}

/** De ingelogde klant, of `null` als er geen (geldige) sessie is. */
export async function getAccountSession(): Promise<AccountSession | null> {
  const token = await readSessionToken()
  if (!token) return null

  const result = await getCustomer(token)
  if (!result.ok) return null

  return { token, customer: result.data.customer }
}

/** Het pad naar het inlogformulier, met een terugweg naar de pagina waar de bezoeker heen wilde. */
export const loginPath = (next?: string): string =>
  next ? `/account/inloggen?next=${encodeURIComponent(next)}` : '/account/inloggen'

/** Adresboek van de ingelogde klant; een fout levert een lege lijst op, nooit een uitzondering. */
export async function getAddresses(token: string): Promise<CustomerAddress[]> {
  const result = await getCustomerAddresses(token)
  return result.ok ? result.data.addresses : []
}

/**
 * Bestellingen van de ingelogde klant; een fout levert een lege lijst op.
 *
 * De filters gaan door naar het CMS en dus naar de DATABASE — niet naar een filter over het antwoord.
 * Met twintig bestellingen per pagina zou dat laatste "de eerste twintig, en daarvan wat past" geven:
 * een lijst die klopt tot iemand meer dan twintig bestellingen heeft.
 */
export async function getOrders(
  token: string,
  filters: OrderListFilters = {},
): Promise<{ orders: OrderSummary[]; page: number; totalPages: number; total: number }> {
  const result = await getCustomerOrders(token, filters)
  const page = filters.page && filters.page > 0 ? filters.page : 1
  if (!result.ok) return { orders: [], page: 1, totalPages: 1, total: 0 }
  return {
    orders: result.data.orders,
    page: result.data.page ?? page,
    totalPages: result.data.totalPages ?? 1,
    total: result.data.total ?? result.data.orders.length,
  }
}
