/**
 * Bestelgeschiedenis van de ingelogde klant.
 *
 * ── Waarom er twee statussen naast elkaar staan ───────────────────────────────────────────────
 * Elke regel toont de BESTELstatus én de BETAALstatus. Dat lijkt dubbelop tot het uit elkaar loopt:
 * een bestelling die "Wordt klaargemaakt" is terwijl de betaling "Deels terugbetaald" is, is precies
 * de combinatie waarover een klant belt. Eén samengevoegd label maakt juist die situatie onzichtbaar.
 *
 * ── De link bevat het toegangstoken van de bestelling ─────────────────────────────────────────
 * Dezelfde link als in de bestelbevestiging (`/order/<nummer>?token=…`). Het bestelnummer is oplopend
 * en dus te raden; het token niet. De eigen klant hoort dat token te krijgen — hij heeft het al in zijn
 * mailbox staan.
 */
import { LocaleLink } from '@/components/LocaleLink'
import {
  formatDate,
  formatMoney,
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  paymentStatusTone,
} from '@/lib/commerce/format'
import type { OrderSummary } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

export function OrderHistory({
  orders,
  ui,
  locale,
}: {
  orders: OrderSummary[]
  ui: ShopUIStrings
  locale: string
}) {
  if (orders.length === 0) {
    return <p className="account-empty">{ui.noOrdersYet}</p>
  }

  return (
    <ul className="order-history">
      {orders.map((order) => (
        <li className="order-history-item" key={order.orderNumber}>
          <div className="order-history-head">
            <div>
              <LocaleLink
                className="order-history-number"
                href={`/order/${order.orderNumber}?token=${encodeURIComponent(order.accessToken)}`}
              >
                {order.orderNumber}
              </LocaleLink>
              <span className="order-history-date">{formatDate(order.placedAt, locale)}</span>
              {/*
               * De afleverdatum naast de besteldatum. Staat er alleen als het pakket ER IS: bij een
               * bestelling die nog onderweg is zou een lege regel de klant laten zoeken naar iets dat
               * er nog niet hoort te zijn.
               */}
              {order.deliveredAt && (
                <span className="order-history-date">
                  {ui.deliveredOn} {formatDate(order.deliveredAt, locale)}
                </span>
              )}
            </div>
            <div className="order-history-badges">
              <span className={`order-status order-status--${orderStatusTone(order.status)}`}>
                {orderStatusLabel(order.status)}
              </span>
              <span className={`order-status order-status--${paymentStatusTone(order.paymentStatus)}`}>
                {ui.paymentStatus}: {paymentStatusLabel(order.paymentStatus)}
              </span>
            </div>
          </div>

          <ul className="order-history-lines">
            {order.lines.map((line, i) => (
              <li key={i}>
                {line.quantity}× {line.title}
                {line.variantTitle ? ` (${line.variantTitle})` : ''}
              </li>
            ))}
          </ul>

          <div className="order-history-foot">
            <span className="order-history-total">{formatMoney(order.totalCents, order.currency)}</span>
            <span className="order-history-links">
              {/*
               * Een gewone `<a>` en geen LocaleLink: dit is geen pagina van de site maar een
               * API-route die een PDF teruggeeft. Een taalvoorvoegsel ervoor zou hem 404 maken (de
               * proxy laat `/api/` juist buiten de taal-routing).
               */}
              <a
                className="link-arrow"
                download
                href={`/api/commerce/invoice?order=${encodeURIComponent(order.orderNumber)}&token=${encodeURIComponent(order.accessToken)}`}
              >
                {ui.downloadInvoice}
              </a>
              <LocaleLink
                className="link-arrow"
                href={`/order/${order.orderNumber}?token=${encodeURIComponent(order.accessToken)}`}
              >
                {ui.viewOrder}
              </LocaleLink>
            </span>
          </div>

          {order.trackingNumber && (
            <p className="order-history-tracking">
              {ui.trackingNumber}: <strong>{order.trackingNumber}</strong>
              {order.trackingUrl && (
                <>
                  {' — '}
                  <a href={order.trackingUrl} rel="noopener noreferrer" target="_blank">
                    {ui.trackOrder}
                  </a>
                </>
              )}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}
