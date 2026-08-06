import { LocaleLink } from '@/components/LocaleLink'
import type { Category } from '@/lib/commerce/types'
import type { ShopSidebarWidget, ShopUIStrings } from '@/lib/types'

/**
 * Zijbalk van de winkel: categorielijst plus optionele redactionele widgets.
 *
 * ── Waarom de categorieën hier staan en niet als pillen boven het rooster ─────────────────────
 * Filterpillen werken bij vier categorieën en vallen uit elkaar bij twaalf: ze lopen over meerdere
 * regels, duwen het rooster naar beneden en de bezoeker ziet niet meer in één oogopslag wat er te
 * koop is. Een verticale lijst schaalt wél, en houdt de navigatie op élke winkelpagina op dezelfde
 * plek staan — de bezoeker springt van categorie naar categorie zonder terug te hoeven.
 *
 * ── Waarom de zijbalk ook op de categoriepagina staat ─────────────────────────────────────────
 * Dat is het hele punt van een zijbalk. Zou hij alleen op de ingang staan, dan is elke
 * categoriewissel een omweg via `/winkel`.
 *
 * De widgets komen uit `content/<taal>/shop.json` en zijn dus door de klant te bewerken zonder
 * codewijziging. Geen widgets ingevuld → alleen de categorielijst; de zijbalk valt niet stil om.
 */
export function ShopSidebar({
  categories,
  activeSlug,
  ui,
  widgets = [],
}: {
  categories: Category[]
  /** Slug van de categorie die nu bekeken wordt; leeg op de winkelingang. */
  activeSlug?: string
  ui: ShopUIStrings
  widgets?: ShopSidebarWidget[]
}) {
  return (
    <aside className="shop-sidebar">
      {categories.length > 0 && (
        <nav aria-label={ui.categoriesTitle} className="shop-widget">
          <h2 className="shop-widget-title">{ui.categoriesTitle}</h2>
          <ul className="shop-catlist">
            <li>
              <LocaleLink
                className={`shop-catlink${!activeSlug ? ' shop-catlink--active' : ''}`}
                href="/winkel"
              >
                {ui.allCategories}
              </LocaleLink>
            </li>
            {categories.map((c) => (
              <li key={String(c.id)}>
                <LocaleLink
                  className={`shop-catlink${activeSlug === c.slug ? ' shop-catlink--active' : ''}`}
                  href={`/product-categorie/${c.slug}`}
                >
                  {c.name}
                </LocaleLink>
                {/* Subcategorieën blijven ingeklapt onder hun hoofdcategorie: de boom is bewust
                    één niveau diep (zie de categories-endpoint in het CMS). */}
                {c.children && c.children.length > 0 && (
                  <ul className="shop-catlist shop-catlist--sub">
                    {c.children.map((child) => (
                      <li key={String(child.id)}>
                        <LocaleLink
                          className={`shop-catlink${activeSlug === child.slug ? ' shop-catlink--active' : ''}`}
                          href={`/product-categorie/${child.slug}`}
                        >
                          {child.name}
                        </LocaleLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}

      {widgets.map((w) => (
        <div className="shop-widget" key={w.title}>
          <h2 className="shop-widget-title">{w.title}</h2>
          {w.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={w.imageAlt || w.title} className="shop-widget-image" src={w.image} />
          )}
          {w.text && <p className="shop-widget-text">{w.text}</p>}
          {w.linkLabel && w.linkUrl && (
            <LocaleLink className="shop-widget-link" href={w.linkUrl}>
              {w.linkLabel}
            </LocaleLink>
          )}
        </div>
      ))}
    </aside>
  )
}
