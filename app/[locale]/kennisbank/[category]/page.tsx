import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { Shell } from '@/components/Shell'
import { BlogGrid, CtaBand, PageHero } from '@/components/sections'
import { categorySlug, getBlogCards, getBlogCategories, getBlogIndex } from '@/content/blog'
import { categoryLabel, fill, getUI } from '@/content/ui'
import { activeLocales } from '@/lib/i18n'
import { pageAlternates } from '@/lib/seo'

/** Eén onderwerp uit de kennisbank. */

export function generateStaticParams() {
  const out: Array<{ locale: string; category: string }> = []
  for (const locale of activeLocales()) {
    for (const c of getBlogCategories(locale)) out.push({ locale, category: c.slug })
  }
  return out
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale, category } = await params
  const t = getUI(locale).kennisbank
  const found = getBlogCategories(locale).find((c) => c.slug === category)
  if (!found) return { title: `${t.title} — IZZI Beauty` }
  const label = categoryLabel(locale, found.name)
  const articles = found.count === 1 ? t.article : t.articles
  return {
    title: `${label} — ${t.title} — IZZI Beauty`,
    description: fill(t.categoryMetaDescription, { count: found.count, articles, name: label.toLowerCase() }),
    alternates: pageAlternates(`/kennisbank/${category}`, locale),
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}) {
  const { locale, category } = await params
  const categories = getBlogCategories(locale)
  const found = categories.find((c) => c.slug === category)
  if (!found) notFound()

  const t = getUI(locale).kennisbank
  const label = categoryLabel(locale, found.name)
  const articles = found.count === 1 ? t.article : t.articles
  const blogIndex = getBlogIndex(locale)
  // Filteren op de categorienaam via dezelfde `categorySlug`, zodat link en route niet uiteenlopen.
  const posts = getBlogCards(locale).filter((p) => categorySlug(p.category ?? '') === category)

  return (
    <Shell locale={locale}>
      <PageHero
        breadcrumb={label}
        eyebrow={t.eyebrow}
        text={fill(t.categoryHeroText, { count: found.count, articles })}
        title={label}
      />
      <section className="section">
        <div className="container">
          <div className="kb-categories">
            <LocaleLink className="kb-category" href="/kennisbank">
              {t.allTopics}
            </LocaleLink>
            {categories.map((c) => (
              <LocaleLink
                className={`kb-category${c.slug === category ? ' kb-category--active' : ''}`}
                href={`/kennisbank/${c.slug}`}
                key={c.slug}
              >
                {categoryLabel(locale, c.name)} <span className="kb-count">{c.count}</span>
              </LocaleLink>
            ))}
          </div>
          <BlogGrid posts={posts} page={1} />
        </div>
      </section>
      <CtaBand cta={blogIndex.cta} />
    </Shell>
  )
}
