import { LocaleLink } from '@/components/LocaleLink'
import { Media } from '@/components/Media'
import type { Category } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

/**
 * Categorietegel voor de winkelingang.
 *
 * ── Waarom de winkelingang categorieën toont en geen producten ────────────────────────────────
 * Bij deze klant staan producten in groepen die weinig met elkaar te maken hebben (pigmenten,
 * machines, naalden, opleidingen). Eén lange lijst van álle producten dwingt de bezoeker eerst te
 * filteren voordat er iets bruikbaars op het scherm staat. De oude site deed dat al goed: `/winkel`
 * toont de categorieën, en pas ná een keuze zie je producten.
 *
 * Dezelfde `.card`-klassen als `ProductCard` — visueel één familie, maar een eigen component omdat
 * een categorie geen prijs, voorraad of variant heeft.
 */
export function CategoryCard({ category }: { category: Category }) {
  return (
    <LocaleLink className="card category-card" href={`/product-categorie/${category.slug}`}>
      <div className="card-media">
        <Media
          src={category.image?.url ?? ''}
          alt={category.image?.alt || category.name}
          shape="card"
          label={category.name}
        />
      </div>
      <div className="card-body">
        <h3>{category.name}</h3>
        {category.description && <p>{category.description}</p>}
      </div>
    </LocaleLink>
  )
}

/**
 * Rooster van categorietegels.
 *
 * `.grid-3` is hetzelfde rooster als de productlijst gebruikt, zodat de winkelingang en een
 * categoriepagina dezelfde ritmiek houden.
 */
export function CategoryGrid({ categories, ui }: { categories: Category[]; ui: ShopUIStrings }) {
  if (!categories.length) {
    return (
      <div className="empty-state">
        <p>{ui.noCategories}</p>
      </div>
    )
  }

  return (
    <div className="grid-3 category-grid">
      {categories.map((c) => (
        <CategoryCard category={c} key={String(c.id)} />
      ))}
    </div>
  )
}
