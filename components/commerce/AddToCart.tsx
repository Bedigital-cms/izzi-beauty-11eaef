'use client'
/**
 * Variantkiezer + hoeveelheid + "in winkelwagen".
 *
 * De client stuurt uitsluitend `{ variantId, quantity }` naar de eigen API-route. Er is geen veld
 * waarin een prijs zou kunnen staan — het CMS bepaalt elk bedrag opnieuw uit de database. Dat is de
 * kern van de prijsautoriteit; zie recalculateCart.ts in het CMS.
 */
import * as React from 'react'
import { useRouter } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { formatMoney } from '@/lib/commerce/format'
import type { Product, Variant } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

import { useCart } from './CartProvider'

export function AddToCart({
  product,
  ui,
}: {
  product: Product
  ui: ShopUIStrings
}) {
  const router = useRouter()
  const { add, error, clearError } = useCart()

  // Bij één variant is er niets te kiezen; bij meerdere begint de keuze leeg zodat de bezoeker
  // bewust kiest in plaats van per ongeluk de eerste variant af te rekenen.
  const single = product.variants.length === 1 ? product.variants[0] : null
  const [selectedId, setSelectedId] = React.useState<string | null>(single ? String(single.id) : null)
  const [quantity, setQuantity] = React.useState(1)
  const [busy, setBusy] = React.useState(false)
  const [added, setAdded] = React.useState(false)

  const selected: Variant | null =
    product.variants.find((v) => String(v.id) === selectedId) ?? single ?? null

  // "Toegevoegd"-melding weer weghalen.
  React.useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 2500)
    return () => clearTimeout(t)
  }, [added])

  const maxQuantity = Math.max(1, Math.min(selected?.available ?? 1, 99))
  const canAdd = Boolean(selected?.inStock) && !busy

  async function onAdd() {
    if (!selected) return
    setBusy(true)
    clearError()
    const ok = await add(selected.id, quantity)
    setBusy(false)
    if (ok) {
      setAdded(true)
      // De winkelwagenpagina en de badge tonen nu andere aantallen; server-componenten opnieuw laten
      // renderen zodat alles klopt.
      router.refresh()
    }
  }

  /*
   * Geen varianten betekent dat er niets te koop is: de API geeft alleen varianten terug die
   * gepubliceerd zijn. Toon dan een uitgeschakelde knop in plaats van alleen een regel tekst — een
   * productpagina zonder enige knop leest als een fout in de site, ook al klopt hij.
   */
  if (!product.variants.length) {
    return (
      <div className="atc">
        <button className="btn btn-ghost atc-btn" disabled type="button">
          {ui.outOfStock}
        </button>
      </div>
    )
  }

  return (
    <div className="atc">
      {/* Variantkiezer alleen bij meer dan één keuze. */}
      {product.variants.length > 1 && (
        <div className="variant-group">
          <span className="form-label">{ui.chooseOption}</span>
          <div className="variant-options">
            {product.variants.map((v) => {
              const active = String(v.id) === selectedId
              return (
                <button
                  aria-pressed={active}
                  className={`variant-option${active ? ' variant-option--active' : ''}${
                    v.inStock ? '' : ' variant-option--soldout'
                  }`}
                  disabled={!v.inStock}
                  key={String(v.id)}
                  onClick={() => {
                    setSelectedId(String(v.id))
                    setQuantity(1)
                  }}
                  type="button"
                >
                  <span className="variant-option-title">{v.title}</span>
                  <span className="variant-option-price">
                    {formatMoney(v.priceCents, product.currency)}
                  </span>
                  {!v.inStock && <span className="variant-option-note">{ui.soldOut}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Prijs van de gekozen variant. */}
      {selected && (
        <div className="atc-price">
          <span className="atc-price-now">{formatMoney(selected.priceCents, product.currency)}</span>
          {selected.compareAtPriceCents !== null && selected.compareAtPriceCents > selected.priceCents && (
            <span className="atc-price-was">
              {formatMoney(selected.compareAtPriceCents, product.currency)}
            </span>
          )}
        </div>
      )}

      <div className="atc-row">
        <div className="qty">
          <button
            aria-label="Eén minder"
            className="qty-btn"
            disabled={quantity <= 1 || busy}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            type="button"
          >
            −
          </button>
          <input
            aria-label={ui.quantity}
            className="qty-input"
            max={maxQuantity}
            min={1}
            onChange={(e) => {
              const n = Number(e.target.value)
              setQuantity(Number.isFinite(n) ? Math.min(Math.max(1, n), maxQuantity) : 1)
            }}
            type="number"
            value={quantity}
          />
          <button
            aria-label="Eén meer"
            className="qty-btn"
            disabled={quantity >= maxQuantity || busy}
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            type="button"
          >
            +
          </button>
        </div>

        <button className="btn btn-gold atc-btn" disabled={!canAdd} onClick={onAdd} type="button">
          {busy ? ui.addingToCart : added ? ui.addedToCart : selected?.inStock ? ui.addToCart : ui.outOfStock}
        </button>
      </div>

      {/* Pas ná het toevoegen: anders stuurt de pagina bezoekers naar een lege winkelwagen. */}
      {added && (
        <LocaleLink className="atc-cart-link" href="/winkelwagen">
          {ui.viewCart} →
        </LocaleLink>
      )}

      {/* Voorraadmelding alleen als het echt knijpt — anders is het ruis. */}
      {selected?.inStock && selected.available <= 5 && (
        <p className="atc-stock">{ui.onlyLeft.replace('{n}', String(selected.available))}</p>
      )}

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
