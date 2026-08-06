/**
 * Client voor de webshop-API. **Alleen server-side.**
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * DEZE MODULE GOOIT NOOIT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Elke functie geeft `{ ok: true, data }` of `{ ok: false, error }` terug. Er is geen throw-pad naar
 * buiten. Dat is geen stijlkeuze maar een harde eis van de bouwpijplijn:
 *
 * Het CMS doet vóór het publiceren een validatie-build van deze repo. Die build erft de omgeving van
 * de CMS-server en draait in github-modus op een verse, ondiepe clone zónder `.env.local`. Met andere
 * woorden: de build LOOPT met `COMMERCE_API_URL` leeg of onbereikbaar. Zou een fetch dan gooien, dan
 * faalt de build — en daarmee de publicatie van ÉLKE tenant, ook die zonder webshop.
 *
 * Daarom drie lagen:
 *   1. geen enkele commerce-route prerendert (`force-dynamic`, `generateStaticParams` → `[]`);
 *   2. deze client gooit nooit;
 *   3. de pagina's tonen bij `ok: false` een nette lege of foutstaat.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * DE SLEUTEL BLIJFT OP DE SERVER
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `COMMERCE_API_KEY` heeft geen `NEXT_PUBLIC_`-prefix, dus Next vervangt hem in clientcode door
 * `undefined`. Deze module hoort dus alleen aangeroepen te worden vanuit Server Components en de
 * route-handlers in `app/api/commerce/*` — nooit uit een `'use client'`-bestand.
 */
import { commerceApiKey, commerceApiUrl, commerceEnabled } from './config'
import type {
  Address,
  Cart,
  CheckoutResult,
  Customer,
  CustomerAddress,
  Order,
  OrderStatusResponse,
  OrderSummary,
  Product,
  Category,
  ShippingMethod,
  ShopConfig,
} from './types'

/** Foutsoorten die de aanroeper kan onderscheiden. */
export type CommerceErrorCode =
  /** Webshop staat uit voor deze tenant. */
  | 'disabled'
  /** Env-variabelen ontbreken (bijv. tijdens de validatie-build). */
  | 'unconfigured'
  /** Netwerk onbereikbaar, DNS-fout, time-out. */
  | 'network'
  /** De API antwoordde met een foutcode. */
  | 'http'
  /** Het antwoord was geen leesbare JSON. */
  | 'parse'

export type CommerceError = {
  code: CommerceErrorCode
  /** Machineleesbare code van de API (`NOT_FOUND`, `OUT_OF_STOCK`, …) als die er is. */
  apiCode?: string
  /** Melding die aan de bezoeker getoond mag worden. */
  message: string
  status?: number
  details?: unknown
}

export type Result<T> = { ok: true; data: T } | { ok: false; error: CommerceError }

const fail = (code: CommerceErrorCode, message: string, extra: Partial<CommerceError> = {}): Result<never> => ({
  ok: false,
  error: { code, message, ...extra },
})

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Cachetijd in seconden. Laat weg (of 0) voor `no-store` — verplicht voor cart en checkout. */
  revalidate?: number
  /** Sessietoken van een klant. */
  customerToken?: string
  /** Voorkomt dubbele bestellingen bij het afrekenen. */
  idempotencyKey?: string
}

/**
 * Eén plek waar alle verzoeken langs gaan.
 *
 * Merk op dat er geen `throw` uit kan komen: elke fout wordt een `Result`.
 */
async function request<T>(path: string, opts: RequestOptions = {}): Promise<Result<T>> {
  if (!commerceEnabled()) {
    return fail('disabled', 'De webshop is niet beschikbaar.')
  }

  const base = commerceApiUrl()
  const key = commerceApiKey()
  if (!base || !key) {
    // Dit is het normale geval tijdens de validatie-build. Geen fout, gewoon "niet geconfigureerd".
    return fail('unconfigured', 'De webshop is nog niet ingesteld.')
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${key}` }
  if (opts.body !== undefined) headers['content-type'] = 'application/json'
  if (opts.customerToken) headers['x-customer-token'] = opts.customerToken
  if (opts.idempotencyKey) headers['idempotency-key'] = opts.idempotencyKey

  let response: Response
  try {
    response = await fetch(`${base}${path}`, {
      method: opts.method ?? 'GET',
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      // Alleen de catalogus mag gecachet worden; alles met een winkelwagen of bestelling nooit.
      ...(opts.revalidate && opts.revalidate > 0
        ? { next: { revalidate: opts.revalidate } }
        : { cache: 'no-store' as const }),
    })
  } catch (err) {
    // Onbereikbaar tijdens een build of bij een storing. Geen throw naar buiten.
    return fail('network', 'De webshop is tijdelijk niet bereikbaar.', { details: String(err) })
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return fail('parse', 'Onverwacht antwoord van de webshop.', { status: response.status })
  }

  const envelope = body as { ok?: boolean; data?: T; error?: { code?: string; message?: string; details?: unknown } }

  if (!response.ok || envelope?.ok !== true) {
    return fail('http', envelope?.error?.message ?? 'De webshop gaf een foutmelding.', {
      apiCode: envelope?.error?.code,
      status: response.status,
      details: envelope?.error?.details,
    })
  }

  return { ok: true, data: envelope.data as T }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Catalogus — mag 60 seconden gecachet worden
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Cachetijd voor catalogusgegevens. Voorraad kan dus tot een minuut oud zijn; de definitieve
 *  controle gebeurt bij het toevoegen aan de winkelwagen en bij het afrekenen. */
const CATALOG_TTL = 60

export const getShopConfig = () => request<ShopConfig>('/config', { revalidate: CATALOG_TTL })

export type ProductListParams = {
  page?: number
  limit?: number
  category?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'title' | 'price_asc' | 'price_desc'
}

export function getProducts(params: ProductListParams = {}) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.category) qs.set('category', params.category)
  if (params.search) qs.set('search', params.search)
  if (params.sort) qs.set('sort', params.sort)
  const query = qs.toString()

  return request<{ products: Product[]; page: number; limit: number; total: number; totalPages: number }>(
    `/products${query ? `?${query}` : ''}`,
    { revalidate: CATALOG_TTL },
  )
}

export const getProduct = (slug: string) =>
  request<{ product: Product; pricesIncludeTax: boolean }>(`/products/${encodeURIComponent(slug)}`, {
    revalidate: CATALOG_TTL,
  })

export const getCategories = () =>
  request<{ categories: Category[]; flat: Category[] }>('/categories', { revalidate: CATALOG_TTL })

/**
 * Dezelfde categorieën, maar ZONDER cache.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DIT NAAST `getCategories` BESTAAT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * De categoriepagina geeft een 404 als de slug niet in de lijst staat. Die lijst komt uit de cache
 * van 60 seconden, en dat combineert slecht: een net aangemaakte of geïmporteerde categorie bestaat
 * wél, maar staat nog niet in de gecachete lijst — en dan geeft de site een minuut lang "Niet
 * gevonden" op een pagina die gewoon bestaat. Precies dat gebeurde na een productimport: klikken gaf
 * 404, en na een tijdje verversen werkte het "ineens".
 *
 * Dat is erger dan traag: een 404 is een definitief antwoord. Zoekmachines onthouden hem, en een
 * bezoeker die net op een categorie klikt concludeert dat de winkel stuk is.
 *
 * Deze variant wordt daarom ALLEEN gebruikt op het pad waar de conclusie "bestaat niet" zou volgen.
 * Het normale geval — een categorie die in de lijst staat — blijft volledig gecachet, dus de winkel
 * wordt hier niet langzamer van. Alleen een onbekende slug kost één extra verzoek, en dat is precies
 * het geval waarin je zeker wil weten dat je het goed hebt.
 */
export const getCategoriesUncached = () =>
  request<{ categories: Category[]; flat: Category[] }>('/categories')

export const getShippingMethods = (params: {
  country?: string
  subtotalCents?: number
  /** Korting op de winkelwagen: het CMS toetst een drempel voor gratis verzending ná aftrek hiervan. */
  discountCents?: number
  /** Totaalgewicht in grammen; bepaalt welke staffel geldt bij een gewichtsafhankelijke methode. */
  weightGrams?: number
}) => {
  const qs = new URLSearchParams()
  if (params.country) qs.set('country', params.country)
  if (params.subtotalCents !== undefined) qs.set('subtotalCents', String(params.subtotalCents))
  if (params.discountCents !== undefined) qs.set('discountCents', String(params.discountCents))
  if (params.weightGrams !== undefined) qs.set('weightGrams', String(params.weightGrams))
  return request<{ methods: ShippingMethod[]; country: string }>(`/shipping-methods?${qs.toString()}`)
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Winkelwagen — NOOIT cachen
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Nieuwe winkelwagen.
 *
 * `customerToken` is optioneel maar wél belangrijk: is de bezoeker al ingelogd, dan koppelt het CMS de
 * wagen meteen aan zijn account. Zonder dat komt zijn bestelling niet in zijn bestelgeschiedenis
 * terecht, want de bestelling neemt de klant over uit de winkelwagen. (Logt hij later in, dan wordt de
 * gastwagen bij het inloggen alsnog gekoppeld.)
 */
export const createCart = (customerToken?: string) =>
  request<{ cart: Cart }>('/carts', { method: 'POST', customerToken })

export const getCart = (token: string) => request<{ cart: Cart }>(`/carts/${encodeURIComponent(token)}`)

/** Alleen variant + aantal. Er is geen veld voor een prijs — die bepaalt het CMS. */
export const addCartLine = (token: string, variantId: string | number, quantity = 1) =>
  request<{ cart: Cart }>(`/carts/${encodeURIComponent(token)}/items`, {
    method: 'POST',
    body: { variantId, quantity },
  })

export const updateCartLine = (token: string, lineId: string, quantity: number) =>
  request<{ cart: Cart }>(`/carts/${encodeURIComponent(token)}/items/${encodeURIComponent(lineId)}`, {
    method: 'PATCH',
    body: { quantity },
  })

export const removeCartLine = (token: string, lineId: string) =>
  request<{ cart: Cart }>(`/carts/${encodeURIComponent(token)}/items/${encodeURIComponent(lineId)}`, {
    method: 'DELETE',
  })

export const updateCart = (
  token: string,
  patch: {
    discountCode?: string | null
    shippingMethodId?: string | number | null
    shippingAddress?: Record<string, unknown>
    billingAddress?: Record<string, unknown>
    email?: string
  },
) => request<{ cart: Cart }>(`/carts/${encodeURIComponent(token)}`, { method: 'PATCH', body: patch })

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Afrekenen
// ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Start het afrekenen.
 *
 * `expectedTotalCents` is het bedrag dat de klant OP HET SCHERM ZAG. Wijkt het af van wat het CMS
 * berekent, dan komt er `PRICE_CHANGED` terug en moet de klant opnieuw bevestigen — er wordt nooit
 * stilzwijgend een ander bedrag afgerekend.
 *
 * `idempotencyKey` is verplicht: zonder die sleutel maakt een dubbelgeklikte knop twee bestellingen
 * en twee betalingen.
 */
export const startCheckout = (args: {
  cartToken: string
  returnUrl: string
  expectedTotalCents?: number
  method?: string | null
  customerNote?: string
  idempotencyKey: string
}) =>
  request<CheckoutResult>('/checkout', {
    method: 'POST',
    idempotencyKey: args.idempotencyKey,
    body: {
      cartToken: args.cartToken,
      returnUrl: args.returnUrl,
      expectedTotalCents: args.expectedTotalCents,
      method: args.method ?? null,
      customerNote: args.customerNote,
    },
  })

/**
 * Betaalstatus opvragen.
 *
 * De bedankpagina MOET dit pollen: Mollie stuurt de klant terug vóórdat de webhook binnen kan zijn.
 * Aannemen dat de bestelling betaald is omdat de klant op de bedankpagina staat, is fout.
 */
export const getOrderStatus = (orderNumber: string, token: string) =>
  request<OrderStatusResponse>(
    `/orders/${encodeURIComponent(orderNumber)}/status?token=${encodeURIComponent(token)}`,
  )

export const getOrder = (orderNumber: string, token: string) =>
  request<{ order: Order }>(`/orders/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`)

/** Stuurt de klant een e-mail met links naar zijn bestellingen. Antwoord is altijd hetzelfde. */
export const lookupOrders = (email: string) =>
  request<{ message: string }>('/orders/lookup', { method: 'POST', body: { email } })

/**
 * De factuur-PDF van een bestelling.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DIT NIET DOOR `request()` HEEN GAAT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Die functie verwacht JSON met een `{ ok, data }`-envelop; hier komen ruwe PDF-bytes terug. Er is dus
 * niets te ontleden — alleen door te geven. Wat wél hetzelfde blijft: deze functie GOOIT NIET (zie de
 * toelichting bovenaan dit bestand), want ook dit pad loopt tijdens de validatie-build met een lege of
 * onbereikbare API.
 */
export async function getInvoicePdf(
  orderNumber: string,
  token: string,
): Promise<Result<{ pdf: Buffer; fileName: string }>> {
  if (!commerceEnabled()) return fail('disabled', 'De webshop is niet beschikbaar.')

  const base = commerceApiUrl()
  const key = commerceApiKey()
  if (!base || !key) return fail('unconfigured', 'De webshop is nog niet ingesteld.')

  let response: Response
  try {
    response = await fetch(
      `${base}/orders/${encodeURIComponent(orderNumber)}/invoice?token=${encodeURIComponent(token)}`,
      { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' },
    )
  } catch (err) {
    return fail('network', 'De webshop is tijdelijk niet bereikbaar.', { details: String(err) })
  }

  if (!response.ok) {
    return fail('http', 'Deze factuur is niet beschikbaar.', { status: response.status })
  }

  const pdf = Buffer.from(await response.arrayBuffer())

  /*
   * De bestandsnaam komt uit de `Content-Disposition` van het CMS. Zelf een naam bedenken zou betekenen
   * dat de mailbijlage en de download anders heten — en dan lijken het twee documenten.
   */
  const disposition = response.headers.get('content-disposition') ?? ''
  const match = /filename="([^"]+)"/.exec(disposition)
  const fileName = match?.[1] ?? `factuur-${orderNumber}.pdf`

  return { ok: true, data: { pdf, fileName } }
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// Klantaccount
// ─────────────────────────────────────────────────────────────────────────────────────────────

/** Wat een adresformulier mag insturen. Het `id` hoort in het pad, niet in de body. */
export type AddressPayload = Address & { label?: string; type?: 'both' | 'shipping' | 'billing' }

/**
 * Nieuw account. Geeft GEEN sessie terug.
 *
 * Het CMS maakt het account aan met een onbevestigd e-mailadres en mailt een code van zes cijfers. De
 * sessie ontstaat pas bij `verifyRegistration`. Zonder die stap zou een typefout in het adres een
 * account opleveren waarvan de bestelbevestiging én de herstelmail onbereikbaar zijn.
 */
export const registerCustomer = (args: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phone?: string
  acceptsMarketing?: boolean
}) =>
  request<{ needsVerification: boolean; email: string; message: string }>('/customers/register', {
    method: 'POST',
    body: args,
  })

/**
 * Activeert het account met de code uit de mail en logt de klant meteen in.
 *
 * `password` is optioneel: zonder wachtwoord wordt het account wél geactiveerd, maar komt er geen
 * sessie terug (`token: null`) en logt de bezoeker daarna zelf in. Dat is het pad als hij de pagina
 * tussendoor herlaadt.
 */
export const verifyRegistration = (args: {
  email: string
  code: string
  password?: string
  cartToken?: string
}) =>
  request<{
    verified: boolean
    token: string | null
    expiresAt?: string
    customer: Customer | null
  }>('/customers/verify', { method: 'POST', body: args })

/** Stuurt de activatiecode opnieuw. Antwoord is altijd hetzelfde, ook bij een onbekend adres. */
export const resendRegistrationCode = (email: string) =>
  request<{ message: string }>('/customers/otp', { method: 'POST', body: { email, purpose: 'register' } })

export const loginCustomer = (args: { email: string; password: string; cartToken?: string }) =>
  request<{ token: string; expiresAt: string; customer: Customer }>('/customers/login', {
    method: 'POST',
    body: args,
  })

export const getCustomer = (customerToken: string) =>
  request<{ customer: Customer }>('/customers/me', { customerToken })

/**
 * Profiel bijwerken — in TWEE stappen.
 *
 * Zonder `code` wordt er niets opgeslagen: het CMS mailt een code en antwoordt met
 * `{ needsCode: true }`. Mét `code` wordt de wijziging bevestigd en pas dan bewaard. Reden: een sessie
 * leeft dertig dagen, dus zonder die bevestiging kan wie een cookie heeft stil iemands gegevens
 * aanpassen.
 */
export const updateCustomer = (
  customerToken: string,
  patch: {
    firstName?: string
    lastName?: string
    phone?: string
    acceptsMarketing?: boolean
    code?: string
  },
) =>
  request<{
    customer: Customer | null
    /** Stap 1: er is een code gemaild, er is nog niets gewijzigd. */
    needsCode?: boolean
    /** `false` = er ging geen nieuwe mail (wachttijd); de vorige code geldt nog. */
    codeSent?: boolean
    /** Stap 2 geslaagd. */
    saved?: boolean
    /** Er was niets te wijzigen; dan komt er geen code aan te pas. */
    unchanged?: boolean
    message?: string
  }>('/customers/me', { method: 'PATCH', body: patch, customerToken })

/** Filters van de bestellijst. Alles optioneel; leeg = geen filter. */
export type OrderListFilters = {
  page?: number
  /** Besteldatum vanaf (`YYYY-MM-DD`). */
  from?: string
  /** Besteldatum tot en met (`YYYY-MM-DD`). */
  to?: string
  /** Totaalbedrag in euro's. */
  min?: string
  max?: string
  sort?: 'newest' | 'oldest' | 'price_desc' | 'price_asc'
}

export const getCustomerOrders = (customerToken: string, filters: OrderListFilters = {}) => {
  const qs = new URLSearchParams()
  qs.set('page', String(filters.page && filters.page > 0 ? filters.page : 1))
  for (const key of ['from', 'to', 'min', 'max', 'sort'] as const) {
    const value = filters[key]
    if (value) qs.set(key, String(value))
  }

  return request<{ orders: OrderSummary[]; page: number; total: number; totalPages: number }>(
    `/customers/me/orders?${qs.toString()}`,
    { customerToken },
  )
}

export const getCustomerAddresses = (customerToken: string) =>
  request<{ addresses: CustomerAddress[] }>('/customers/me/addresses', { customerToken })

export const createCustomerAddress = (customerToken: string, address: AddressPayload) =>
  request<{ address: CustomerAddress }>('/customers/me/addresses', {
    method: 'POST',
    body: address,
    customerToken,
  })

export const updateCustomerAddress = (
  customerToken: string,
  id: string | number,
  address: AddressPayload,
) =>
  request<{ address: CustomerAddress }>(`/customers/me/addresses/${encodeURIComponent(String(id))}`, {
    method: 'PATCH',
    body: address,
    customerToken,
  })

export const deleteCustomerAddress = (customerToken: string, id: string | number) =>
  request<{ deleted: boolean }>(`/customers/me/addresses/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    customerToken,
  })

export const requestPasswordReset = (email: string) =>
  request<{ message: string }>('/customers/password', { method: 'POST', body: { email } })

/** Nieuw wachtwoord met het token uit de KNOP in de mail. */
export const resetPassword = (token: string, password: string) =>
  request<{ message: string }>('/customers/password', { method: 'PATCH', body: { token, password } })

/**
 * Nieuw wachtwoord met de CODE uit de mail.
 *
 * De hoofdweg: werkt ook als de klant de mail op zijn telefoon leest terwijl hij op zijn laptop zit —
 * dan is een link onhandig en een code van zes cijfers niet.
 */
export const resetPasswordWithCode = (args: { email: string; code: string; password: string }) =>
  request<{ message: string }>('/customers/password', { method: 'PATCH', body: args })
