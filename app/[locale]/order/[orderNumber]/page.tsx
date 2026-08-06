import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { Media } from '@/components/Media'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getOrder } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import {
  formatDate,
  formatMoney,
  orderStatusLabel,
  orderStatusTone,
  taxIsIncluded,
  taxLineLabel,
} from '@/lib/commerce/format'

/**
 * /order/[orderNumber]?token=… — bestelling bekijken en volgen.
 *
 * Werkt voor een GAST zonder account: het `token` in de URL is het toegangsbewijs. Dat is nodig omdat
 * het bestelnummer oplopend is (IZZI-2026-00042) en dus te raden — het token niet.
 *
 * Dezelfde link staat in de bestelbevestiging.
 */
export const dynamic = 'force-dynamic'

/** Nooit prerenderen en nooit fetchen op bouwtijd. */
export function generateStaticParams() {
  return []
}

/**
 * ⚠️ Niet indexeren.
 *
 * Deze URL bevat een bestelnummer en een toegangstoken. Zou Google die indexeren, dan zijn
 * bestelgegevens van klanten via een zoekopdracht te vinden — een privacy-incident.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

/** Een stap in de tijdlijn. `tone: 'ended'` = hier stopt het, en niet goed (geannuleerd/terugbetaald). */
type TimelineStep = { done: boolean; key: string; label: string; tone?: 'ended' }

/**
 * De stappen die een bestelling doorloopt, voor de tijdlijn.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DIT NIET ÉÉN OP ÉÉN DE `status` VOLGT
 * ══════════════════════════════════════════════════════════════════════════════════════════════════
 * De eerste opzet zocht de stap op die precies gelijk was aan `order.status`. Dat klopt zolang een
 * bestelling netjes van betaald naar bezorgd loopt, maar `status` is één veld dat óók eindtoestanden
 * over GELD moet uitdrukken. Werd een bezorgde bestelling later (deels) terugbetaald, dan stond er
 * `refunded`, kwam geen enkele stap meer overeen en zag de klant een lege tijdlijn: alsof zijn pakket
 * nooit betaald en nooit verstuurd was, terwijl hij het al in huis had.
 *
 * Daarom leidt elke stap zijn eigen FEIT af: is er betaald (`paidAt`), is er verzonden
 * (`fulfillmentStatus`), is er bezorgd (`deliveredAt`). Die feiten blijven staan, wat er daarna met het
 * geld ook gebeurt.
 *
 * ── Waarom de feiten CASCADEREN ───────────────────────────────────────────────────────────────────
 * `delivered` impliceert verzonden, verzonden impliceert klaargemaakt en betaald. Dat leiden we hier af
 * in plaats van erop te vertrouwen dat alle velden meelopen: `fulfillmentStatus` is in de admin een
 * los, met de hand te zetten veld. Een winkelier die een bestelling meteen op "Afgeleverd" zet zonder
 * `fulfillmentStatus` aan te raken, zou anders een tijdlijn opleveren met een gat: bezorgd ✓, maar
 * verzonden ✗. Voor de klant is dat onmogelijk te lezen.
 *
 * ── Wat er bij de EINDTOESTANDEN gebeurt ──────────────────────────────────────────────────────────
 * `cancelled`, `expired`, `refunded` en `partially_refunded` zijn geen stap vooruit — het zijn plekken
 * waar het verhaal ophoudt. Ze verdwenen daarom uit de tijdlijn, en dat was precies het probleem: de
 * klant zag drie bleke bolletjes en niet wat er met zijn bestelling gebeurd is.
 *
 * Nu krijgt elke eindtoestand een eigen laatste stap in een andere kleur:
 *   · geannuleerd/verlopen → de route ná dat punt is nooit gelopen, dus laten we die weg. Een lijstje
 *     met "Verzonden" en "Afgeleverd" dat nooit meer aankomt, laat een klant wachten op een pakket dat
 *     niet komt.
 *   · (deels) terugbetaald → de bezorgroute is WEL gelopen en blijft dus staan, met het terugbetalen
 *     als extra stap erachter. Geld terug is iets ánders dan een bestelling die niet is uitgevoerd.
 *
 * De teksten komen uit `orderStatusLabel`, dezelfde bron als de badge bovenaan de pagina — anders
 * staat er straks "Afgeleverd" in de tijdlijn en "delivered" in de badge.
 */
const timelineSteps = (order: {
  deliveredAt: null | string
  fulfillmentStatus: string
  paidAt: null | string
  status: string
}): TimelineStep[] => {
  const delivered = Boolean(order.deliveredAt) || order.status === 'delivered'
  const shipped = delivered || order.fulfillmentStatus === 'fulfilled' || order.status === 'fulfilled'
  const preparing =
    shipped || order.fulfillmentStatus === 'partially_fulfilled' || order.status === 'processing'
  const paid =
    preparing ||
    Boolean(order.paidAt) ||
    ['delivered', 'fulfilled', 'paid', 'partially_refunded', 'refunded'].includes(order.status)

  // "Besteld" is altijd waar: zonder bestelling was deze pagina er niet. Het geeft de klant een begin
  // om vanaf te lezen — zonder die stap begint de tijdlijn bij een onafgeronde "Betaald", en dan lijkt
  // het alsof er iets mislukt is terwijl hij alleen nog niet betaald heeft.
  const placed: TimelineStep = { done: true, key: 'placed', label: 'Besteld' }

  if (order.status === 'cancelled' || order.status === 'expired') {
    return [
      placed,
      // Was er al betaald voordat het misging? Dan hoort dat er te staan: het is precies wat de klant
      // wil weten als hij zijn geld terug verwacht.
      ...(paid ? [{ done: true, key: 'paid', label: orderStatusLabel('paid') }] : []),
      { done: true, key: order.status, label: orderStatusLabel(order.status), tone: 'ended' as const },
    ]
  }

  const steps: TimelineStep[] = [
    placed,
    { done: paid, key: 'paid', label: orderStatusLabel('paid') },
    { done: preparing, key: 'processing', label: orderStatusLabel('processing') },
    { done: shipped, key: 'fulfilled', label: orderStatusLabel('fulfilled') },
    { done: delivered, key: 'delivered', label: orderStatusLabel('delivered') },
  ]

  if (order.status === 'refunded' || order.status === 'partially_refunded') {
    steps.push({
      done: true,
      key: order.status,
      label: orderStatusLabel(order.status),
      tone: 'ended',
    })
  }

  return steps
}

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderNumber: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale, orderNumber } = await params
  const { token } = await searchParams

  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  // Zonder token geen toegang — hetzelfde antwoord als bij een onbekend bestelnummer.
  if (!token) notFound()

  const result = await getOrder(orderNumber, token)
  if (!result.ok) notFound()

  const order = result.data.order
  const money = (cents: number) => formatMoney(cents, order.currency)

  // Zit de btw al in de getoonde bedragen? Bepaalt het woord én de plek van de btw-regels hieronder.
  const taxIncluded = taxIsIncluded(order)
  const taxRows = (
    order.taxLines.length
      ? order.taxLines.map((t) => ({ cents: t.taxCents, label: taxLineLabel(t, taxIncluded) }))
      : order.taxCents > 0
        ? [{ cents: order.taxCents, label: taxLineLabel({}, taxIncluded) }]
        : []
  ).map((row, i) => (
    <div className="summary-row summary-row--muted" key={i}>
      <span>{row.label}</span>
      <span>{money(row.cents)}</span>
    </div>
  ))

  // Hoe ver is de bestelling? De laatste afgeronde stap is waar de klant nu staat.
  const steps = timelineSteps(order)
  const currentIndex = steps.reduce((last, step, i) => (step.done ? i : last), -1)

  return (
    <Shell locale={locale}>
      <section className="section">
        <div className="container container--narrow">
          <header className="order-header">
            <h1>
              {ui.orderNumber} {order.orderNumber}
            </h1>
            <p className="order-meta">
              {ui.orderDate}: {formatDate(order.placedAt, locale)}
            </p>
            <span className={`order-status order-status--${orderStatusTone(order.status)}`}>
              {orderStatusLabel(order.status)}
            </span>
          </header>

          {/*
            De tijdlijn staat er ALTIJD. Hij was verborgen bij `cancelled`/`expired`, en dan viel precies
            de uitleg weg bij de bestellingen waarover een klant belt. `timelineSteps` maakt voor die
            gevallen een korte tijdlijn die op de eindtoestand ophoudt.
          */}
          <ol className="timeline">
            {steps.map((step, i) => (
              <li
                className={`timeline-item${step.done ? ' timeline-item--done' : ''}${
                  currentIndex === i ? ' timeline-item--current' : ''
                }${step.tone === 'ended' ? ' timeline-item--ended' : ''}`}
                key={step.key}
              >
                <span className="timeline-dot" aria-hidden="true" />
                <span className="timeline-label">{step.label}</span>
              </li>
            ))}
          </ol>

          {order.trackingNumber && (
            <div className="order-tracking">
              <strong>{ui.trackingNumber}:</strong> {order.trackingNumber}
              {order.trackingUrl && (
                <>
                  {' — '}
                  <a href={order.trackingUrl} rel="noopener noreferrer" target="_blank">
                    {ui.trackOrder}
                  </a>
                </>
              )}
            </div>
          )}

          <div className="order-lines">
            {order.lines.map((line, i) => (
              <div className="cart-line" key={i}>
                <div className="cart-line-media">
                  <Media alt={line.title} shape="square" src={line.image ?? ''} />
                </div>
                <div className="cart-line-body">
                  <span className="cart-line-title">{line.title}</span>
                  {line.variantTitle && <span className="cart-line-variant">{line.variantTitle}</span>}
                  <span className="cart-line-unit">
                    {line.quantity} × {money(line.unitPriceCents)}
                  </span>
                </div>
                <div className="cart-line-total">{money(line.lineTotalCents)}</div>
              </div>
            ))}
          </div>

          {/*
            De btw staat ONDER het totaal als hij al in de prijzen zit, en erbóven als hij erbovenop
            komt — zo telt deze kolom altijd op tot het bedrag dat eronder staat. Zie `taxIsIncluded`.
          */}
          <div className="summary order-summary">
            <div className="summary-row">
              <span>
                {ui.subtotal}
                {taxIncluded && order.taxCents > 0 ? ` (${ui.taxInclusive})` : ''}
              </span>
              <span>{money(order.subtotalCents)}</span>
            </div>
            {order.discountCents > 0 && (
              <div className="summary-row summary-row--discount">
                <span>
                  {ui.discount}
                  {order.discount?.code ? ` (${order.discount.code})` : ''}
                </span>
                <span>−{money(order.discountCents)}</span>
              </div>
            )}
            <div className="summary-row">
              <span>
                {ui.shipping}
                {order.shippingMethod?.name ? ` (${order.shippingMethod.name})` : ''}
              </span>
              <span>{money(order.shippingCents)}</span>
            </div>
            {/* Btw per tarief: zo staat het ook op de factuur. */}
            {!taxIncluded && taxRows}
            <div className="summary-row summary-row--total">
              <span>{ui.total}</span>
              <span>{money(order.totalCents)}</span>
            </div>
            {taxIncluded && taxRows}
            {order.refundedCents > 0 && (
              <div className="summary-row summary-row--discount">
                <span>Terugbetaald</span>
                <span>−{money(order.refundedCents)}</span>
              </div>
            )}
          </div>

          {order.shippingAddress && (
            <div className="order-address">
              <h2>{ui.shippingAddress}</h2>
              <p>
                {[order.shippingAddress.firstName, order.shippingAddress.lastName].filter(Boolean).join(' ')}
                <br />
                {order.shippingAddress.company && (
                  <>
                    {order.shippingAddress.company}
                    <br />
                  </>
                )}
                {[
                  order.shippingAddress.street,
                  order.shippingAddress.houseNumber,
                  order.shippingAddress.houseNumberAddition,
                ]
                  .filter(Boolean)
                  .join(' ')}
                <br />
                {order.shippingAddress.postalCode} {order.shippingAddress.city}
                <br />
                {order.shippingAddress.country}
              </p>
            </div>
          )}

          <div className="order-actions">
            {/* Ook hier een gewone `<a>`: `/api/` staat buiten de taal-routing. */}
            <a
              className="btn btn-outline"
              download
              href={`/api/commerce/invoice?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(token)}`}
            >
              {ui.downloadInvoice}
            </a>
            <LocaleLink className="link-arrow" href="/winkel">
              {ui.continueShopping}
            </LocaleLink>
          </div>
        </div>
      </section>
    </Shell>
  )
}
