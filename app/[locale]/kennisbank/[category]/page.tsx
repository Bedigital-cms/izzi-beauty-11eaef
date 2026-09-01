import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { Shell } from '@/components/Shell'
import { BlogGrid, CtaBand, PageHero } from '@/components/sections'
import { categorySlug, getBlogCards, getBlogCategories, getBlogIndex } from '@/content/blog'
import { activeLocales } from '@/lib/i18n'

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
  const found = getBlogCategories(locale).find((c) => c.slug === category)
  if (!found) return { title: 'Kennisbank — IZZI Beauty' }
  return {
    title: `${found.name} — Kennisbank — IZZI Beauty`,
    description: `${found.count} ${found.count === 1 ? 'artikel' : 'artikelen'} over ${found.name.toLowerCase()}.`,
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

  const blogIndex = getBlogIndex(locale)
  // Filteren op de categorienaam via dezelfde `categorySlug`, zodat link en route niet uiteenlopen.
  const posts = getBlogCards(locale).filter((p) => categorySlug(p.category ?? '') === category)

  return (
    <Shell locale={locale}>
      <PageHero
        breadcrumb={found.name}
        eyebrow="Kennisbank"
        text={`${found.count} ${found.count === 1 ? 'artikel' : 'artikelen'} over dit onderwerp.`}
        title={found.name}
      />
      <section className="section">
        <div className="container">
          <div className="kb-categories">
            <LocaleLink className="kb-category" href="/kennisbank">
              Alle onderwerpen
            </LocaleLink>
            {categories.map((c) => (
              <LocaleLink
                className={`kb-category${c.slug === category ? ' kb-category--active' : ''}`}
                href={`/kennisbank/${c.slug}`}
                key={c.slug}
              >
                {c.name} <span className="kb-count">{c.count}</span>
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
