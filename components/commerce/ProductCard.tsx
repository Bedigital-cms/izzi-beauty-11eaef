import { LocaleLink } from '@/components/LocaleLink'
import { Media } from '@/components/Media'
import { QuickAdd } from '@/components/commerce/QuickAdd'
import { discountPercent, formatMoney } from '@/lib/commerce/format'
import type { Product } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

/**
 * Productkaart voor de winkeloverzichtspagina.
 *
 * ── Waarom een eigen component en geen uitbreiding van `CardGrid` ─────────────────────────────
 * `CardGrid` werkt met `LinkCard`, en dat type wordt óók door de Content Editor gebruikt: die rendert
 * een recursief formulier over de velden. Zou `LinkCard` een prijs en voorraad krijgen, dan zou een
 * redacteur die velden zien bij élke behandelingskaart op de site — velden die daar niets betekenen.
 *
 * Dus: een eigen component dat dezelfde CSS-klassen (`.card`, `.card-media`, `.card-body`) hergebruikt.
 * Visueel identiek, semantisch gescheiden.
 *
 * ── Waarom de kaart geen `<a>` om alles heen heeft ────────────────────────────────────────────
 * De kaart eindigt in een "in winkelwagen"-knop, en een `<button>` binnen een `<a>` is ongeldige
 * HTML: browsers navigeren dan alsnog bij het klikken op de knop. Daarom ligt de link als een
 * absolute overlay over de kaart (`.card-link`) en staat de knop daar met `position: relative`
 * bovenop. Klikken op de kaart navigeert, klikken op de knop niet — en de link blijft één
 * focusbaar element voor toetsenbord en schermlezer.
 */
export function ProductCard({
  product,
  ui,
}: {
  product: Product
  ui: ShopUIStrings
}) {
  const price = product.priceCents
  /*
   * `price` mag `null` zijn (een product zonder prijs, of een variantproduct zonder varianten). Dat
   * ging hier als `price ?? 0` de kortingsberekening in, en dan is élke van-prijs "100% korting": een
   * product zonder prijs kreeg een "Sale!"-badge naast een streepje. Geen prijs betekent geen korting.
   */
  const off = price === null ? null : discountPercent(price, product.compareAtPriceCents)
  // Bij variantproducten is de getoonde prijs de laagste, dus "vanaf".
  const showFrom = product.productType === 'variable' && product.variants.length > 1
  const href = `/product/${product.slug}`

  return (
    <div className="card product-card">
      <div className="card-media">
        <Media
          src={product.images[0]?.url ?? ''}
          alt={product.images[0]?.alt || product.title}
          shape="card"
          label={product.title}
        />
        {/* De ronde badge zegt "Sale!", het exacte percentage staat in de title — een getal in een
            cirkel van 54px wordt bij tweecijferige kortingen onleesbaar klein. */}
        {off !== null && (
          <span className="product-badge" title={`−${off}%`}>
            {ui.onSale}
          </span>
        )}
        {!product.inStock && <span className="product-badge product-badge--muted">{ui.soldOut}</span>}
      </div>
      <div className="card-body">
        {/* De overlay-link. De tekst zit in de titel eronder, dus hier een toegankelijke naam. */}
        <LocaleLink aria-label={product.title} className="card-link" href={href} />
        <h3>{product.title}</h3>
        {product.shortDescription && <p>{product.shortDescription}</p>}
        <div className="product-price">
          {price === null ? (
            <span className="product-price-empty">—</span>
          ) : (
            <>
              {showFrom && <span className="product-price-from">{ui.from} </span>}
              <span className="product-price-now">{formatMoney(price, product.currency)}</span>
              {product.compareAtPriceCents !== null && product.compareAtPriceCents > price && (
                <span className="product-price-was">
                  {formatMoney(product.compareAtPriceCents, product.currency)}
                </span>
              )}
            </>
          )}
        </div>
        <QuickAdd href={href} product={product} ui={ui} />
      </div>
    </div>
  )
}

/** Rooster van productkaarten; hergebruikt `.grid-3` uit globals.css. */
export function ProductGrid({
  products,
  ui,
}: {
  products: Product[]
  ui: ShopUIStrings
}) {
  if (!products.length) {
    return (
      <div className="empty-state">
        <p>{ui.noProducts}</p>
      </div>
    )
  }

  return (
    <div className="grid-3 product-grid">
      {products.map((p) => (
        <ProductCard key={String(p.id)} product={p} ui={ui} />
      ))}
    </div>
  )
}
