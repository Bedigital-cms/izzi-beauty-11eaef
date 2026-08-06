import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { CategoryGrid } from '@/components/commerce/CategoryCard'
import { ProductGrid } from '@/components/commerce/ProductCard'
import { ShopSidebar } from '@/components/commerce/ShopSidebar'
import { CtaBand, PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { fillLabel, getShop } from '@/content/shop'
import { getCategories, getCategoriesUncached, getProducts } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import type { Category } from '@/lib/commerce/types'

/**
 * /product-categorie/[slug] — de producten van één categorie.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM EEN EIGEN `categorie`-SEGMENT EN NIET `/product/[handle]`
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `/product/[handle]` is de productdetailpagina. Categorieën en producten in diezelfde namespace zetten
 * geeft precies het probleem dat het `/winkel`-segment zelf oplost: slugs komen uit de DATABASE, dus
 * een categorie "e-book" en een product "e-book" botsen stil, zonder dat een build dat kan opmerken.
 *
 * Een vast tussensegment maakt de botsing onmogelijk. Next geeft een statisch segment bovendien
 * voorrang boven `[handle]`, dus `/product-categorie/pmu-naalden` bereikt deze route ook als er ooit een
 * product met de slug `categorie` zou bestaan.
 *
 * `force-dynamic` en de lege `generateStaticParams`: zie de toelichting in `../../page.tsx`. De
 * validatie-build van het CMS draait zonder bereikbare API en mag hier niets ophalen.
 */
export const dynamic = 'force-dynamic'

/**
 * Bewust LEEG en zonder fetch — net als bij `[handle]`. `dynamicParams` staat standaard aan, dus elke
 * categorie werkt gewoon op aanvraag.
 */
export function generateStaticParams() {
  return []
}

/** Zoekt een categorie in de platte lijst; die bevat ook subcategorieën. */
const findCategory = (flat: Category[], slug: string): Category | undefined =>
  flat.find((c) => c.slug === slug)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  if (!commerceEnabled()) return {}

  const shop = getShop(locale)
  const result = await getCategories()
  // NOOIT gooien in generateMetadata: dat laat het hele verzoek falen. Een minimale titel is beter.
  if (!result.ok) return { title: shop.hero.title }

  const category = findCategory(result.data.flat, slug)
  if (!category) return { title: shop.hero.title }

  return {
    title: `${category.name} — ${shop.hero.title}`,
    description: category.description || shop.hero.text,
  }
}

type SearchParams = { sorteren?: string; pagina?: string }

const SORT_MAP: Record<string, 'newest' | 'price_asc' | 'price_desc' | 'title'> = {
  nieuwste: 'newest',
  'prijs-laag': 'price_asc',
  'prijs-hoog': 'price_desc',
  naam: 'title',
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<SearchParams>
}) {
  const { locale, slug } = await params
  const query = await searchParams

  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  const page = Math.max(1, Number(query.pagina ?? 1) || 1)
  const sort = SORT_MAP[query.sorteren ?? ''] ?? 'newest'

  // Beide aanroepen kunnen falen zonder dat de pagina omvalt: de client gooit nooit.
  const [categoriesResult, productsResult] = await Promise.all([
    getCategories(),
    getProducts({ category: slug, page, sort, limit: 24 }),
  ])

  let tree = categoriesResult.ok ? categoriesResult.data.categories : []
  let flat = categoriesResult.ok ? categoriesResult.data.flat : []
  let category = findCategory(flat, slug)

  /*
   * Onbekende categorie → 404, niet een lege lijst. Een lege lijst zou een typefout in de URL laten
   * lijken op "uitverkocht", en zoekmachines zouden elke verzonnen slug als geldige pagina indexeren.
   *
   * Alleen als de categorielijst daadwerkelijk is opgehaald: bij een onbereikbare API weten we niet of
   * de categorie bestaat, en dan is de foutmelding hieronder het juiste antwoord — geen 404.
   *
   * ── Waarom er eerst nog een keer ONGECACHET gekeken wordt ────────────────────────────────────
   * De lijst hierboven mag 60 seconden oud zijn (`CATALOG_TTL`). Een categorie die net is aangemaakt
   * of geïmporteerd bestaat dus wél, maar staat nog niet in die lijst — en dan zou deze regel een
   * minuut lang 404 geven op een pagina die gewoon werkt. Dat is precies wat er na een productimport
   * gebeurde: klikken gaf "Niet gevonden", en na een tijdje verversen werkte het "ineens".
   *
   * Een 404 is een definitief antwoord: zoekmachines onthouden hem, en een bezoeker concludeert dat
   * de winkel stuk is. Zo'n conclusie mag niet op verouderde gegevens rusten. Daarom controleren we
   * op dit pad — en alléén op dit pad — nog één keer bij de bron. Het normale geval blijft volledig
   * gecachet, dus de winkel wordt hier niet langzamer van.
   */
  if (categoriesResult.ok && !category) {
    const fresh = await getCategoriesUncached()
    if (fresh.ok) {
      tree = fresh.data.categories
      flat = fresh.data.flat
      category = findCategory(flat, slug)
    }
    // Nog steeds niet gevonden? Dan bestaat hij echt niet.
    if (!category) notFound()
  }

  const products = productsResult.ok ? productsResult.data.products : []
  const total = productsResult.ok ? productsResult.data.total : 0
  const totalPages = productsResult.ok ? productsResult.data.totalPages : 0
  const unavailable = !productsResult.ok && productsResult.error.code !== 'http'

  // Subcategorieën van deze categorie: die tonen we als tegels boven de producten.
  const children = tree.find((c) => c.slug === slug)?.children ?? []

  const title = category?.name ?? shop.hero.title

  /** Bouwt een URL met de huidige filters, zodat sorteren de pagina niet weggooit. */
  const linkWith = (patch: Partial<SearchParams>): string => {
    const qs = new URLSearchParams()
    const merged = { ...query, ...patch }
    if (merged.sorteren) qs.set('sorteren', merged.sorteren)
    if (merged.pagina && merged.pagina !== '1') qs.set('pagina', merged.pagina)
    const s = qs.toString()
    return `/product-categorie/${slug}${s ? `?${s}` : ''}`
  }

  return (
    <Shell locale={locale}>
      <PageHero
        breadcrumb={title}
        eyebrow={shop.hero.eyebrow}
        text={category?.description || shop.hero.text}
        title={title}
      />

      <section className="section">
        <div className="container">
          <div className="shop-layout">
            <ShopSidebar
              activeSlug={slug}
              categories={tree}
              ui={ui}
              widgets={shop.sidebarWidgets}
            />

            <div className="shop-main">
              <p className="shop-breadcrumb">
                <LocaleLink href="/winkel">{shop.hero.breadcrumb}</LocaleLink>
                <span> / </span>
                <span>{title}</span>
              </p>

              {/* Subcategorieën eerst: bij een hoofdcategorie is dat de volgende keuze. */}
              {children.length > 0 && <CategoryGrid categories={children} ui={ui} />}

              {/*
               * Aantal links, sorteeropties rechts.
               *
               * De balk staat er ALTIJD zodra er producten zijn — ook bij één product. Een balk die
               * bij kleine categorieën verdwijnt en bij grote weer opduikt, laat de winkel
               * inconsistent aanvoelen: de bezoeker leert de plek van de sorteerknoppen niet.
               * Alleen bij nul producten heeft sorteren echt geen betekenis.
               */}
              <div className="shop-toolbar">
                <p className="shop-toolbar-count">
                  {total > 0 ? fillLabel(ui.productCount, { n: total }) : ui.noProducts}
                </p>

                {total > 0 && (
                  <div className="shop-sorts">
                    <span className="shop-sorts-label">{ui.sortBy}</span>
                    {[
                      ['nieuwste', ui.sortNewest],
                      ['prijs-laag', ui.sortPriceAsc],
                      ['prijs-hoog', ui.sortPriceDesc],
                      ['naam', ui.sortTitle],
                    ].map(([value, label]) => {
                      const active = (query.sorteren ?? 'nieuwste') === value
                      return (
                        <LocaleLink
                          aria-current={active ? 'true' : undefined}
                          className={`shop-sort${active ? ' shop-sort--active' : ''}`}
                          href={linkWith({ sorteren: value, pagina: '1' })}
                          key={value}
                        >
                          {label}
                        </LocaleLink>
                      )
                    })}
                  </div>
                )}
              </div>

              {unavailable ? (
                <div className="empty-state">
                  <p>{ui.genericError}</p>
                </div>
              ) : (
                <ProductGrid products={products} ui={ui} />
              )}

              {totalPages > 1 && (
                <nav aria-label="Paginering" className="shop-pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <LocaleLink
                      className={`shop-page${n === page ? ' shop-page--active' : ''}`}
                      href={linkWith({ pagina: String(n) })}
                      key={n}
                    >
                      {n}
                    </LocaleLink>
                  ))}
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      <CtaBand cta={shop.cta} />
    </Shell>
  )
}
