'use client'
/**
 * Winkelwagen-inhoud met bewerkbare regels.
 *
 * Client-component omdat aantallen wijzigen zonder paginaherlaad moet werken. De TOTALEN komen altijd
 * van de server: dit component rekent nooit zelf een bedrag uit. Zou het dat wel doen, dan zou de
 * weergave kunnen afwijken van wat er afgerekend wordt.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { Media } from '@/components/Media'
import { formatMoneySafe, taxIsIncluded } from '@/lib/commerce/format'
import type { Cart, CartNotice } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

import { useCart } from './CartProvider'

/** Meldingen van de herberekening in gewone taal. */
function noticeText(notice: CartNotice, ui: ShopUIStrings): string {
  switch (notice.type) {
    case 'line_removed':
      return `"${notice.title}" is niet meer beschikbaar en is uit je winkelwagen gehaald.`
    case 'quantity_reduced':
      return `Van "${notice.title}" zijn er nog ${notice.available} beschikbaar. Het aantal is aangepast.`
    case 'discount_dropped':
      return notice.reason === 'minimum_not_met'
        ? `De code ${notice.code} geldt pas vanaf een hoger bestelbedrag.`
        : notice.reason === 'expired'
          ? `De code ${notice.code} is verlopen.`
          : ui.discountInvalid
    case 'shipping_unavailable':
      return 'De gekozen verzendmethode is niet meer beschikbaar. Kies een andere.'
    default:
      return ''
  }
}

export function CartView({
  initialCart,
  ui,
}: {
  initialCart: Cart | null
  ui: ShopUIStrings
}) {
  const router = useRouter()
  const { cart: liveCart, setQuantity, remove, applyDiscount, refresh, error } = useCart()
  const [code, setCode] = React.useState(initialCart?.discountCode ?? '')
  const [busyLine, setBusyLine] = React.useState<string | null>(null)

  // De server gaf de winkelwagen mee bij het renderen; daarna neemt de provider het over.
  const cart = liveCart ?? initialCart

  // Eén keer verversen na hydratie, zodat de weergave zeker actueel is (bijv. als de bezoeker
  // terugkomt met de terugknop en de browser een gecachete pagina toont).
  React.useEffect(() => {
    void refresh()
  }, [refresh])

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="empty-state">
        <h2>{ui.cartEmpty}</h2>
        <p>{ui.cartEmptyText}</p>
        <LocaleLink className="btn btn-gold" href="/winkel">
          {ui.continueShopping}
        </LocaleLink>
      </div>
    )
  }

  const money = (cents: number) => formatMoneySafe(cents, cart.currency)

  // Zit de btw al in de getoonde bedragen? Bepaalt het woord én de plek van de btw-regel hieronder.
  const taxIncluded = taxIsIncluded(cart)
  const taxRow =
    cart.taxCents > 0 ? (
      <div className="summary-row summary-row--muted">
        <span>{taxIncluded ? ui.taxIncluded : ui.tax}</span>
        <span>{money(cart.taxCents)}</span>
      </div>
    ) : null

  return (
    <div className="cart">
      {/* Meldingen bovenaan: de bezoeker moet weten dat er iets is aangepast vóór hij afrekent. */}
      {cart.notices.length > 0 && (
        <div className="cart-notices" role="status">
          {cart.notices.map((n, i) => (
            <p key={i}>{noticeText(n, ui)}</p>
          ))}
        </div>
      )}

      <div className="cart-lines">
        {cart.lines.map((line) => (
          <div className="cart-line" key={line.id}>
            <LocaleLink className="cart-line-media" href={`/product/${line.productSlug}`}>
              <Media alt={line.image?.alt || line.title} shape="square" src={line.image?.url ?? ''} />
            </LocaleLink>

            <div className="cart-line-body">
              <LocaleLink className="cart-line-title" href={`/product/${line.productSlug}`}>
                {line.title}
              </LocaleLink>
              {line.variantTitle && <span className="cart-line-variant">{line.variantTitle}</span>}
              <span className="cart-line-unit">{money(line.unitPriceCents)} per stuk</span>

              <div className="cart-line-actions">
                <div className="qty">
                  <button
                    aria-label="Eén minder"
                    className="qty-btn"
                    disabled={busyLine === line.id}
                    onClick={async () => {
                      setBusyLine(line.id)
                      await setQuantity(line.id, line.quantity - 1)
                      setBusyLine(null)
                      router.refresh()
                    }}
                    type="button"
                  >
                    −
                  </button>
                  <span className="qty-value">{line.quantity}</span>
                  <button
                    aria-label="Eén meer"
                    className="qty-btn"
                    disabled={busyLine === line.id || line.quantity >= line.available}
                    onClick={async () => {
                      setBusyLine(line.id)
                      await setQuantity(line.id, line.quantity + 1)
                      setBusyLine(null)
                      router.refresh()
                    }}
                    type="button"
                  >
                    +
                  </button>
                </div>

                <button
                  className="cart-line-remove"
                  disabled={busyLine === line.id}
                  onClick={async () => {
                    setBusyLine(line.id)
                    await remove(line.id)
                    setBusyLine(null)
                    router.refresh()
                  }}
                  type="button"
                >
                  {ui.remove}
                </button>
              </div>
            </div>

            <div className="cart-line-total">{money(line.lineTotalCents)}</div>
          </div>
        ))}
      </div>

      <aside className="summary">
        <h2>{ui.orderSummary}</h2>

        <div className="discount-row">
          <label className="sr-only" htmlFor="discount">
            {ui.discountCode}
          </label>
          <input
            id="discount"
            onChange={(e) => setCode(e.target.value)}
            placeholder={ui.discountCode}
            type="text"
            value={code}
          />
          <button
            className="btn btn-ghost"
            onClick={async () => {
              await applyDiscount(code.trim() || null)
              router.refresh()
            }}
            type="button"
          >
            {ui.discountApply}
          </button>
        </div>

        {/*
          De btw-regel staat ONDER het totaal als de btw al in de prijzen zit, en erbóven als hij
          erbovenop komt. Zo telt de kolom altijd op tot het bedrag dat eronder staat; zie
          `taxIsIncluded`. Het label volgt dezelfde keuze: "Waarvan btw" tegenover "Btw".
        */}
        <div className="summary-row">
          <span>
            {ui.subtotal}
            {taxIncluded && cart.taxCents > 0 ? ` (${ui.taxInclusive})` : ''}
          </span>
          <span>{money(cart.subtotalCents)}</span>
        </div>
        {cart.discountCents > 0 && (
          <div className="summary-row summary-row--discount">
            <span>
              {ui.discount}
              {cart.discountCode ? ` (${cart.discountCode})` : ''}
            </span>
            <span>−{money(cart.discountCents)}</span>
          </div>
        )}
        <div className="summary-row">
          <span>{ui.shipping}</span>
          <span>{cart.shippingMethodId ? money(cart.shippingCents) : ui.shippingCalculated}</span>
        </div>
        {!taxIncluded && taxRow}
        <div className="summary-row summary-row--total">
          <span>{ui.total}</span>
          <span>{money(cart.totalCents)}</span>
        </div>
        {taxIncluded && taxRow}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <LocaleLink className="btn btn-gold summary-cta" href="/afrekenen">
          {ui.checkout}
        </LocaleLink>
        <LocaleLink className="link-arrow" href="/winkel">
          {ui.continueShopping}
        </LocaleLink>
      </aside>
    </div>
  )
}
