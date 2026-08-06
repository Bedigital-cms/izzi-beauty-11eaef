import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { Shell } from '@/components/Shell'
import { BlogGrid, CtaBand, PageHero, POSTS_PER_PAGE } from '@/components/sections'
import { getBlogCards, getBlogIndex } from '@/content/blog'
import { activeLocales } from '@/lib/i18n'

/**
 * Paged blog index: /<locale>/blog/page/<n> (WordPress-style, matching the migrated URLs).
 *
 * Page 1 lives at the bare /blog — /blog/page/1 redirects there so the first page has a single
 * canonical URL. Every other page is prerendered, so each is separately indexable.
 */

function pageCount(locale: string): number {
  return Math.max(1, Math.ceil(getBlogCards(locale).length / POSTS_PER_PAGE))
}

export function generateStaticParams() {
  const out: Array<{ locale: string; page: string }> = []
  for (const locale of activeLocales()) {
    // Page 1 is served by /blog itself; start at 2.
    for (let n = 2; n <= pageCount(locale); n++) out.push({ locale, page: String(n) })
  }
  return out
}

/** Parse the segment as a page number, rejecting "01", "1.5", "abc" and out-of-range values. */
function parsePage(raw: string, total: number): number | null {
  if (!/^[1-9][0-9]*$/.test(raw)) return null
  const n = Number(raw)
  return n >= 1 && n <= total ? n : null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; page: string }>
}): Promise<Metadata> {
  const { locale, page } = await params
  const data = getBlogIndex(locale)
  const total = pageCount(locale)
  const n = parsePage(page, total)
  if (!n) return { title: 'Niet gevonden — IZZI Beauty' }
  return {
    title: `${data.hero.title} — pagina ${n} van ${total} — IZZI Beauty`,
    description: data.hero.text,
  }
}

export default async function BlogPagedPage({
  params,
}: {
  params: Promise<{ locale: string; page: string }>
}) {
  const { locale, page } = await params
  const total = pageCount(locale)
  const n = parsePage(page, total)
  if (!n) notFound()
  // Keep one canonical URL for the first page.
  if (n === 1) redirect(`/${locale}/blog`)

  const blogIndex = getBlogIndex(locale)
  return (
    <Shell locale={locale}>
      <PageHero {...blogIndex.hero} />
      <section className="section">
        <div className="container">
          <BlogGrid posts={getBlogCards(locale)} page={n} />
        </div>
      </section>
      <CtaBand cta={blogIndex.cta} />
    </Shell>
  )
}
