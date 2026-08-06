/**
 * Weergave van bedragen en statussen. Puur — veilig in zowel server- als clientcode.
 *
 * Bedragen komen als GEHELE CENTEN uit de API (`1999` = €19.99). Er wordt hier nooit met floats
 * gerekend; de deling door 100 gebeurt alleen op het laatste moment, voor de weergave.
 *
 * De NOTATIE van elk bedrag ligt vast (punt = decimaal) — zie `MONEY_LOCALE` hieronder. Alleen de
 * datum- en tekstweergave volgt de taal van de bezoeker.
 */
import type { OrderStatus } from './types'

/**
 * De vaste opmaak-locale voor ELK bedrag in de webshop: punt = decimaal, komma = duizendtal.
 *
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM NIET DE TAAL VAN DE BEZOEKER
 * ═══════════════════════════════════════════════════════════════════════════════════════════
 * Omdat `1.234` dan geen vaste betekenis meer heeft. In nl-NL is dat duizend-tweehonderdvierendertig,
 * in en-US is het één-komma-twee-drie-vier. Deze site draait op `app/[locale]`, dus hetzelfde totaal
 * stond op /nl anders geschreven dan op /en — zelfde winkelwagen, zelfde bedrag, andere tekst. Bij
 * geld is "hangt af van de taal" geen acceptabel antwoord, en een klant die zich vergist bij het
 * afrekenen komt terug bij de winkelier.
 *
 * Één notatie dus, voor elke taal en elke valuta:
 *
 *   EUR → €1,234.56    USD → $1,234.56    GBP → £1,234.56
 *
 * De VALUTA volgt wel de webshop (die komt per product/winkelwagen mee uit de API); alleen de
 * NOTATIE ligt vast. Deze waarde is bewust gelijk aan `MONEY_LOCALE` in het CMS (src/lib/money.ts),
 * zodat een bedrag in de admin en op de site letterlijk hetzelfde leest.
 */
const MONEY_LOCALE = 'en-US'

/**
 * `1999` → `€19.99`.
 *
 * Er is BEWUST geen locale-parameter: die was precies de manier waarop de notatie per taal
 * binnensloop. Zie `MONEY_LOCALE` hierboven.
 *
 * ⚠️ Hydratie-let-op: Node's ICU en die van de browser gebruiken soms een ander spatietype tussen
 * het symbool en het getal (gewone spatie vs. non-breaking space). Formatteer bij voorkeur
 * server-side en geef de string door; moet het toch aan beide kanten, gebruik dan `formatMoneySafe`.
 */
export function formatMoney(cents: number, currency = 'EUR'): string {
  const value = (Number.isFinite(cents) ? cents : 0) / 100
  return new Intl.NumberFormat(MONEY_LOCALE, { style: 'currency', currency }).format(value)
}

/**
 * Zelfde als `formatMoney`, maar normaliseert non-breaking spaces naar gewone spaties.
 *
 * Gebruik dit als hetzelfde bedrag zowel server- als client-side gerenderd kan worden (bijv. een
 * totaal dat na een winkelwagenwijziging opnieuw getekend wordt). Zo blijft de tekst identiek en
 * klaagt React niet over een hydratiemismatch.
 */
export const formatMoneySafe = (cents: number, currency = 'EUR'): string =>
  formatMoney(cents, currency).replace(/[  ]/g, ' ')

/**
 * De bestemming uit een `?next=`-parameter, veilig gemaakt.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DIT NIET `value.startsWith('/')` MAG ZIJN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `//kwaadaardig.nl` begint óók met een slash, maar een browser leest dat als een volledige URL naar
 * een ander domein (protocol-relatief). Alleen op die ene test controleren maakt het inlogformulier dus
 * een open redirect: een link naar `…/inloggen?next=//kwaadaardig.nl` stuurt de bezoeker na een
 * geslaagde inlog naar een vreemde site, met de naam van de winkel in de adresbalk als aanloop.
 *
 * Vandaar twee voorwaarden, en anders de standaardbestemming. Deze functie staat in dit pure bestand
 * omdat zowel de server (de redirect bij een al ingelogde bezoeker) als de client (na het inloggen)
 * hem nodig heeft — en één plek betekent dat de tweede voorwaarde niet ergens ontbreekt.
 */
export const safeNextPath = (value: string | undefined | null, fallback = '/account'): string =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : fallback

/** Btw-tarief in basispunten → leesbaar percentage: `2100` → `21%`. */
export const formatTaxRate = (basisPoints: number): string => {
  const percent = basisPoints / 100
  return `${Number.isInteger(percent) ? percent : percent.toFixed(2).replace(/\.?0+$/, '')}%`
}

/**
 * Zit de btw AL in het subtotaal, of komt hij er nog bovenop?
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DIT UIT DE BEDRAGEN KOMT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * De winkelwagen en de bestelling geven wél alle bedragen mee, maar niet de instelling die bepaalt
 * hoe ze tot stand kwamen (`pricesIncludeTax` staat op de tenant, in het CMS). De bedragen zeggen het
 * zelf, en exact, want het zijn gehele centen:
 *
 *   inclusief → totaal = subtotaal − korting + verzending          (de btw zit er al in)
 *   exclusief → totaal = subtotaal − korting + verzending + btw    (de btw komt erbovenop)
 *
 * Dit bestaat omdat het overzicht anders een OPTELLING TOONT DIE NIET UITKOMT. Bij Nederlandse
 * consumentenprijzen stond er "Subtotaal €287.85 · Verzendkosten €0.00 · Btw 21% €49.96" met
 * daaronder "Totaal €287.85". Alle drie de getallen klopten; de volgorde suggereerde een som die er
 * niet was. Een bezoeker die dat natelt, klikt niet op "betalen".
 *
 * Dezelfde functie staat in het CMS (`taxIsIncluded` in src/lib/money.ts), zodat de winkelwagen, de
 * bestelpagina, de bevestigingsmail, de factuur en het orderpaneel het op dezelfde manier tonen.
 */
export function taxIsIncluded(totals: {
  subtotalCents?: number | null
  discountCents?: number | null
  shippingCents?: number | null
  taxCents?: number | null
  totalCents?: number | null
}): boolean {
  const tax = Number(totals.taxCents ?? 0)
  if (!tax) return true

  const total = Number(totals.totalCents ?? 0)
  const net =
    Number(totals.subtotalCents ?? 0) - Number(totals.discountCents ?? 0) + Number(totals.shippingCents ?? 0)

  if (total === net) return true
  if (total === net + tax) return false

  // Geen van beide klopt precies (een oude of handmatig bijgewerkte bestelling): de dichtstbijzijnde
  // lezing kiezen. Het totaal zelf blijft leidend.
  return Math.abs(total - net) <= Math.abs(total - (net + tax))
}

/**
 * Het label van één btw-regel in een totalenoverzicht.
 *
 * `rateName` komt uit het CMS en is doorgaans al "Btw 21%"; het percentage komt er daarom alleen bij
 * als de naam het nog niet noemt. `included` bepaalt het woord: onder het totaal is de btw een
 * specificatie ("Waarvan btw 21%"), erboven een post die erbij komt ("Btw 21%").
 */
export function taxLineLabel(
  line: { rateName?: string | null; rateBasisPoints?: number | null },
  included: boolean,
): string {
  const rate = line.rateBasisPoints == null ? '' : formatTaxRate(Number(line.rateBasisPoints))
  const name = line.rateName?.trim() || (rate ? `Btw ${rate}` : 'Btw')
  const full = rate && !name.includes('%') ? `${name} ${rate}` : name
  return included ? `Waarvan ${full.charAt(0).toLowerCase()}${full.slice(1)}` : full
}

/** Kortingspercentage tussen van-prijs en verkoopprijs: voor een "-20%"-badge. */
export function discountPercent(priceCents: number, compareAtCents: number | null): number | null {
  if (!compareAtCents || compareAtCents <= priceCents) return null
  return Math.round(((compareAtCents - priceCents) / compareAtCents) * 100)
}

/** Nederlandse datumweergave: `2026-07-30` → `30 juli 2026`. */
export function formatDate(value: string | null | undefined, locale = 'nl-NL'): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

/** Nederlandse labels voor bestelstatussen — wat de KLANT ziet. */
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'In behandeling',
  awaiting_payment: 'Wacht op betaling',
  paid: 'Betaald',
  processing: 'Wordt klaargemaakt',
  fulfilled: 'Verzonden',
  delivered: 'Afgeleverd',
  cancelled: 'Geannuleerd',
  expired: 'Verlopen',
  refunded: 'Terugbetaald',
  partially_refunded: 'Deels terugbetaald',
}

export const orderStatusLabel = (status: OrderStatus | string): string =>
  ORDER_STATUS_LABELS[status as OrderStatus] ?? String(status)

/** Toon-variant voor een statusbadge (bepaalt alleen de kleurklasse in globals.css). */
export function orderStatusTone(status: OrderStatus | string): 'neutral' | 'pending' | 'success' | 'warning' {
  switch (status) {
    case 'delivered':
    case 'paid':
    case 'fulfilled':
      return 'success'
    case 'pending':
    case 'awaiting_payment':
    case 'processing':
      return 'pending'
    case 'cancelled':
    case 'expired':
    case 'refunded':
    case 'partially_refunded':
      return 'warning'
    default:
      return 'neutral'
  }
}

/**
 * Nederlandse labels voor de BETAALstatus — voor de betaalgeschiedenis in het account.
 *
 * Staat los van `orderStatusLabel`, want het zijn twee verschillende dingen: een bestelling kan
 * "Wordt klaargemaakt" zijn terwijl de betaling "Deels terugbetaald" is. Ze samenvoegen in één label
 * zou precies die combinatie onzichtbaar maken — en dat is de combinatie waarover een klant belt.
 */
const PAYMENT_STATUS_LABELS: Record<string, string> = {
  open: 'Nog niet betaald',
  pending: 'Betaling in behandeling',
  authorized: 'Geautoriseerd',
  paid: 'Betaald',
  failed: 'Mislukt',
  expired: 'Verlopen',
  canceled: 'Geannuleerd',
  refunded: 'Terugbetaald',
  partially_refunded: 'Deels terugbetaald',
}

export const paymentStatusLabel = (status: string): string =>
  PAYMENT_STATUS_LABELS[status] ?? String(status)

/** Kleurklasse voor een betaalstatus-badge; gebruikt dezelfde tonen als `orderStatusTone`. */
export function paymentStatusTone(status: string): 'neutral' | 'pending' | 'success' | 'warning' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'open':
    case 'pending':
    case 'authorized':
      return 'pending'
    case 'failed':
    case 'expired':
    case 'canceled':
    case 'refunded':
    case 'partially_refunded':
      return 'warning'
    default:
      return 'neutral'
  }
}

/** Levertijd als tekst: `1`–`2` → "1–2 werkdagen". */
export function deliveryEstimate(min: number | null, max: number | null): string {
  if (min == null && max == null) return ''
  if (min != null && max != null && min !== max) return `${min}–${max} werkdagen`
  const days = min ?? max
  return days === 1 ? '1 werkdag' : `${days} werkdagen`
}

/**
 * schema.org/Offer wil de prijs als string in HOOFDeenheden met een punt: `1999` → `"19.99"`.
 *
 * Bewust met string-manipulatie in plaats van `toFixed`, zodat er geen float aan te pas komt.
 */
export function schemaPrice(cents: number): string {
  const abs = Math.abs(Math.trunc(cents))
  return `${cents < 0 ? '-' : ''}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}

/** Beschikbaarheid voor schema.org. */
export const schemaAvailability = (inStock: boolean): string =>
  inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
