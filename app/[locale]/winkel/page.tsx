import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CategoryGrid } from '@/components/commerce/CategoryCard'
import { ProductGrid } from '@/components/commerce/ProductCard'
import { ShopSidebar } from '@/components/commerce/ShopSidebar'
import { CtaBand, PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getCategories, getProducts } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'

/**
 * /winkel — de winkelingang.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DEZE PAGINA CATEGORIEËN TOONT EN GEEN PRODUCTEN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Het assortiment van deze klant valt uiteen in groepen die niets met elkaar te maken hebben:
 * pigmenten, machines, naalden, starterskits, e-books en online opleidingen. Eén rooster met álles
 * erin dwingt de bezoeker eerst te filteren voordat er iets bruikbaars op het scherm staat.
 *
 * De ingang toont daarom de categorieën als tegels, met de volledige categorielijst in een zijbalk
 * die op élke winkelpagina blijft staan. Pas ná een keuze verschijnen producten, op
 * `/product-categorie/[slug]`.
 *
 * Heeft een webshop nog geen categorieën, dan valt de pagina terug op het productrooster — anders
 * zou een net aangezette winkel met tien producten en nul categorieën een lege ingang tonen.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `force-dynamic` IS HIER GEEN OPTIE MAAR EEN EIS
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Het CMS doet vóór het publiceren een validatie-build van deze repo, en die build LOOPT zonder
 * bereikbare webshop-API (zie de toelichting in lib/commerce/client.ts). Zou deze pagina proberen te
 * prerenderen, dan faalt die build — en daarmee de publicatie van élke tenant, ook die zonder
 * webshop. Niets in deze map mag dus op bouwtijd data ophalen.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  // Alleen content uit git — geen netwerkaanroep. Een fout in generateMetadata laat het verzoek falen.
  const shop = getShop(locale)
  return {
    title: shop.hero.title,
    description: shop.hero.text,
  }
}

export default async function ShopPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params

  // Webshop uit → deze route bestaat niet. Zo zijn er geen dode links bij tenants zonder shop.
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  const categoriesResult = await getCategories()
  const tree = categoriesResult.ok ? categoriesResult.data.categories : []

  /*
   * Terugval voor een winkel zonder categorieën. Alleen dán halen we producten op: bij een normale
   * winkel is dit een tweede API-aanroep die niets toevoegt, en de catalogus-rate-limit is per sleutel.
   */
  const productsResult = tree.length === 0 ? await getProducts({ limit: 24, sort: 'newest' }) : null
  const fallbackProducts = productsResult?.ok ? productsResult.data.products : []

  // API onbereikbaar: nette melding in plaats van een technische fout of een lege pagina zonder uitleg.
  const unavailable = !categoriesResult.ok && categoriesResult.error.code !== 'http'

  return (
    <Shell locale={locale}>
      <PageHero
        breadcrumb={shop.hero.breadcrumb}
        eyebrow={shop.hero.eyebrow}
        text={shop.hero.text}
        title={shop.hero.title}
      />

      <section className="section">
        <div className="container">
          <div className="shop-layout">
            <ShopSidebar categories={tree} ui={ui} widgets={shop.sidebarWidgets} />

            <div className="shop-main">
              {shop.intro && <p className="lead shop-intro">{shop.intro}</p>}

              {unavailable ? (
                <div className="empty-state">
                  <p>{ui.genericError}</p>
                </div>
              ) : tree.length > 0 ? (
                <CategoryGrid categories={tree} ui={ui} />
              ) : (
                <ProductGrid products={fallbackProducts} ui={ui} />
              )}
            </div>
          </div>
        </div>
      </section>

      <CtaBand cta={shop.cta} />
    </Shell>
  )
}
