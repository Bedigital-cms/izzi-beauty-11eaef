import type { Metadata } from 'next'

import { LocaleLink } from '@/components/LocaleLink'
import { Shell } from '@/components/Shell'
import { BlogGrid, CtaBand, PageHero } from '@/components/sections'
import { getBlogCards, getBlogCategories, getBlogIndex } from '@/content/blog'
import { categoryLabel, fill, getUI } from '@/content/ui'
import { pageAlternates } from '@/lib/seo'

/**
 * Kennisbank — de blogartikelen, geordend per onderwerp.
 *
 * De brief vraagt "Blogs" te hernoemen naar Kennisbank en de artikelen per onderwerp te groeperen.
 * Dit is geen tweede blog: dezelfde artikelen uit `blog.json`, met een categoriefilter erboven.
 * `/blog` blijft bestaan, zodat bestaande links en zoekresultaten niet breken.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const categories = getBlogCategories(locale)
  const t = getUI(locale).kennisbank
  return {
    title: `${t.title} — IZZI Beauty`,
    description: fill(t.metaDescription, { n: categories.length }),
    alternates: pageAlternates('/kennisbank', locale),
  }
}

export default async function KennisbankPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const blogIndex = getBlogIndex(locale)
  const categories = getBlogCategories(locale)
  const t = getUI(locale).kennisbank

  return (
    <Shell locale={locale}>
      <PageHero
        breadcrumb={t.title}
        eyebrow={t.eyebrow}
        text={t.heroText}
        title={t.title}
      />
      <section className="section">
        <div className="container">
          {/* De onderwerpen bovenaan: dit is waarvoor de bezoeker hier is, en het scheelt hem
              vijftig kaarten doorscrollen om te ontdekken dat er categorieën bestaan. */}
          {categories.length > 0 && (
            <div className="kb-categories">
              {categories.map((c) => (
                <LocaleLink className="kb-category" href={`/kennisbank/${c.slug}`} key={c.slug}>
                  {categoryLabel(locale, c.name)} <span className="kb-count">{c.count}</span>
                </LocaleLink>
              ))}
            </div>
          )}
          <BlogGrid posts={getBlogCards(locale)} page={1} />
        </div>
      </section>
      <CtaBand cta={blogIndex.cta} />
    </Shell>
  )
}
