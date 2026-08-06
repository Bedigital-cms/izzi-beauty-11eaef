/**
 * Vormen die de webshop-API teruggeeft.
 *
 * Spiegelt docs/ecommerce/01-api-contract.md in het CMS. Twee vaste regels:
 *  - **bedragen zijn gehele centen** (`1999` = € 19,99), met `currency` ernaast;
 *  - **afbeeldingen zijn site-paden** (`/media/bestand.jpg`), nooit absolute CMS-URL's — de site
 *    proxyt ze zelf via `app/media/[filename]`, en een leeg pad betekent "geen afbeelding" zodat
 *    `<Media>` zijn placeholder toont.
 */

export type CommerceImage = { url: string; alt: string }

export type Variant = {
  id: string | number
  title: string
  sku: string
  priceCents: number
  compareAtPriceCents: number | null
  /** Voorraad minus reserveringen. Momentopname: definitief pas bij het afrekenen. */
  available: number
  inStock: boolean
  options: Array<{ name: string; value: string }>
  image: CommerceImage | null
}

export type Product = {
  id: string | number
  title: string
  slug: string
  shortDescription: string
  /**
   * Volledige omschrijving als HTML-string, uit het richText-veld in het CMS.
   *
   * ⚠️ Alleen gevuld door `getProduct(slug)` — in een productlijst is dit altijd `''`, omdat de
   * kaart enkel `shortDescription` toont en de API de HTML daar niet meestuurt.
   */
  description: string
  productType: 'simple' | 'variable'
  /** Bij varianten: de LAAGSTE prijs ("vanaf"). */
  priceCents: number | null
  compareAtPriceCents: number | null
  currency: string
  images: CommerceImage[]
  categories: Array<{ id: string | number; name: string; slug: string }>
  variants: Variant[]
  inStock: boolean
  taxRateBasisPoints: number | null
  seo: { title: string; description: string }
}

export type Category = {
  id: string | number
  name: string
  slug: string
  description: string
  image: CommerceImage | null
  parentId: string | number | null
  sortOrder: number
  children?: Category[]
}

export type ShopConfig = {
  shopName: string
  currency: string
  pricesIncludeTax: boolean
  taxRates: Array<{ id: string | number; name: string; rateBasisPoints: number; isDefault: boolean }>
  environment: 'live' | 'test'
  keyType: 'publishable' | 'secret'
}

export type CartLine = {
  id: string
  variantId: string | number
  productSlug: string
  title: string
  variantTitle: string
  sku: string
  quantity: number
  unitPriceCents: number
  lineTotalCents: number
  lineTaxCents: number
  available: number
  image: CommerceImage | null
}

/** Meldingen bij het herberekenen: wat er is aangepast of weggevallen. Aan de klant tonen. */
export type CartNotice =
  | { type: 'line_removed'; reason: 'variant_gone' | 'variant_inactive'; title: string }
  | { type: 'quantity_reduced'; title: string; from: number; to: number; available: number }
  | {
      type: 'discount_dropped'
      code: string
      reason: 'unknown' | 'expired' | 'not_started' | 'limit_reached' | 'minimum_not_met' | 'inactive'
    }
  | { type: 'shipping_unavailable'; reason: 'no_zone' | 'method_inactive' }

export type Cart = {
  token: string
  status: string
  currency: string
  itemCount: number
  /**
   * Totaalgewicht van de winkelwagen in grammen.
   *
   * Nodig om de verzendmethoden met het JUISTE tarief op te halen: bij een gewichtsstaffel bepaalt
   * dit getal welke staffel geldt. Ging het niet mee, dan rekende het CMS met 0 gram en zag de
   * bezoeker een lager tarief dan hij bij het afrekenen betaalde.
   *
   * Optioneel getypeerd omdat een winkelwagen die uit een oudere CMS-versie komt het veld niet heeft;
   * de aanroeper valt dan terug op 0 — precies het gedrag van vóór deze toevoeging.
   */
  totalWeightGrams?: number
  lines: CartLine[]
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  discountCode: string | null
  shippingMethodId: string | number | null
  email: string | null
  notices: CartNotice[]
}

export type ShippingMethod = {
  id: string | number
  name: string
  description: string
  priceCents: number
  carrier: string
  estimatedDaysMin: number | null
  estimatedDaysMax: number | null
}

export type Address = {
  firstName?: string
  lastName?: string
  company?: string
  street?: string
  houseNumber?: string
  houseNumberAddition?: string
  postalCode?: string
  city?: string
  country?: 'NL' | 'BE' | 'DE'
  phone?: string
}

export type CheckoutResult = {
  orderId: string | number
  orderNumber: string
  accessToken: string
  totalCents: number
  currency: string
  /**
   * Betaalpagina van Mollie; hier stuur je de bezoeker naartoe.
   *
   * `null` bij `alreadyPaid` — dan valt er niets meer te betalen en hoort de bezoeker rechtstreeks
   * naar de bedankpagina.
   */
  checkoutUrl: string | null
  expiresAt?: string
  /**
   * De vorige poging op deze winkelwagen bleek bij Mollie al betaald. Het CMS heeft die bestelling
   * afgehandeld en maakt er bewust geen tweede bij — anders zou de bezoeker twee keer afrekenen voor
   * dezelfde winkelwagen.
   */
  alreadyPaid?: boolean
  /**
   * Dezelfde bestelling en dezelfde betaallink als de vorige poging: de bezoeker was al begonnen met
   * betalen, haakte af, en pakt die betaling nu weer op. Geen nieuwe bestelling.
   */
  resumed?: boolean
}

/**
 * De bestelstatussen van het CMS, één op één.
 *
 * ⚠️ Deze lijst moet compleet blijven. `orderStatusLabel` in format.ts is een `Record<OrderStatus, …>`,
 * dus een status die het CMS wél kent en deze lijst niet, valt niet door de typecheck maar komt bij de
 * klant op het scherm als de RUWE waarde: "delivered" in plaats van "Afgeleverd". Zie de statusopties in
 * `collections/commerce/Orders.ts` en de toegestane overgangen in `orders/stateMachine.ts` in het CMS.
 */
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'paid'
  | 'processing'
  | 'fulfilled'
  | 'delivered'
  | 'cancelled'
  | 'expired'
  | 'refunded'
  | 'partially_refunded'

export type OrderStatusResponse = {
  orderNumber: string
  status: OrderStatus
  paymentStatus: string
  fulfillmentStatus: string
  totalCents: number
  currency: string
  paidAt: string | null
  deliveredAt: string | null
  /** Nog aan het wachten op de uitkomst? Dan blijven pollen. */
  isPending: boolean
}

export type Order = {
  orderNumber: string
  status: OrderStatus
  paymentStatus: string
  fulfillmentStatus: string
  placedAt: string
  paidAt: string | null
  /**
   * Wanneer het pakket bezorgd is. Een FEIT naast de status, net als `paidAt`.
   *
   * De tijdlijn leidt elke stap af uit zo'n tijdstip en niet uit `status` alleen: `status` is één veld
   * dat óók de uitkomst over het GELD moet uitdrukken, dus zodra er later terugbetaald wordt staat er
   * `refunded` en is "is dit bezorgd?" niet meer uit de status te lezen — terwijl het pakket wél
   * bezorgd is. Zie `timelineSteps` op de bestelpagina.
   */
  deliveredAt: string | null
  currency: string
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  refundedCents: number
  totalFormatted: string
  taxLines: Array<{ rateName: string; rateBasisPoints: number; taxableCents: number; taxCents: number }>
  shippingAddress: Address | null
  billingAddress: Address | null
  shippingMethod: { name?: string; carrier?: string; priceCents?: number } | null
  trackingNumber: string | null
  trackingUrl: string | null
  carrier: string | null
  customerNote: string
  discount: { code?: string; type?: string; value?: number } | null
  lines: Array<{
    title: string
    variantTitle: string
    sku: string
    image: string | null
    quantity: number
    unitPriceCents: number
    lineTotalCents: number
    quantityFulfilled: number
  }>
}

export type Customer = {
  id: string | number
  email: string
  firstName: string
  lastName: string
  phone: string
  acceptsMarketing: boolean
}

/**
 * Eén adres uit het adresboek van de klant.
 *
 * Een bestelling verwijst hier NOOIT naar: die kopieert het adres als momentopname. Een adres later
 * wijzigen of verwijderen verandert dus niets aan een oude bestelling — precies de bedoeling.
 */
export type CustomerAddress = Address & {
  id: string | number
  /** Vrij label, bijv. "Thuis" of "Werk". */
  label?: string
  type?: 'both' | 'shipping' | 'billing'
}

export type OrderSummary = {
  orderNumber: string
  accessToken: string
  status: OrderStatus
  paymentStatus: string
  fulfillmentStatus: string
  totalCents: number
  currency: string
  placedAt: string
  /** Wanneer het pakket is afgeleverd, of `null`. Een FEIT naast de status — zie `Order.deliveredAt`. */
  deliveredAt: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  lines: Array<{
    title: string
    variantTitle: string
    quantity: number
    lineTotalCents: number
    image: string | null
  }>
}
