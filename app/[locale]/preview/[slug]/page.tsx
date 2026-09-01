import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Shell } from '@/components/Shell'
import { BlogPostPage, PageHero } from '@/components/sections'
import { getBlogIndex, getPosts } from '@/content/blog'

/**
 * Voorbeeldweergave van één artikel, ook als het nog een CONCEPT is.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM DEZE ROUTE BESTAAT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * De brief vraagt dat IZZI elk nieuw artikel eerst leest en goedkeurt vóór publicatie. Dat kan pas
 * als ze het kunnen ZIEN zoals het straks op de site staat — en een concept staat juist nergens:
 * niet in het overzicht, niet in de kennisbank, en `/[slug]` geeft er een 404 op.
 *
 * Deze route is die ene uitzondering: hij zoekt op in `getPosts` (álle artikelen) in plaats van
 * `getPublishedPosts`, en toont het artikel in de echte opmaak.
 *
 * ── Waarom dit geen lek is ────────────────────────────────────────────────────────────────────
 * De pagina staat op `noindex, nofollow` en komt in geen enkele lijst of sitemap voor. Ze is dus
 * alleen te bereiken door de slug te kennen. Dat is bewust geen wachtwoord: de inhoud is een
 * blogartikel dat binnenkort tóch openbaar wordt, en een inlogscherm zou de goedkeuring
 * omslachtiger maken dan ze hoeft te zijn.
 */

/** Nooit indexeren: een concept hoort niet in Google, ook niet tijdelijk. Dat staat hieronder in
 *  `generateMetadata` — een route mag niet én `metadata` én `generateMetadata` exporteren. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const post = getPosts(locale)[slug]
  return {
    title: post ? `Voorbeeld: ${post.title} — IZZI Beauty` : 'Voorbeeld — IZZI Beauty',
    robots: { index: false, follow: false },
  }
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const post = getPosts(locale)[slug]
  if (!post) notFound()

  const { cta } = getBlogIndex(locale)
  const isDraft = post.status === 'draft'

  return (
    <Shell locale={locale}>
      {/* Een duidelijke band bovenaan, zodat niemand een concept aanziet voor een live pagina —
          bijvoorbeeld wanneer de link wordt doorgestuurd. */}
      <div className="preview-band">
        {isDraft
          ? 'Voorbeeld — dit artikel is een concept en staat nog niet op de website.'
          : 'Voorbeeld — dit artikel is al gepubliceerd.'}
      </div>
      <PageHero
        breadcrumb={post.title}
        eyebrow={post.category || 'Blog'}
        text={post.excerpt}
        title={post.title}
      />
      <BlogPostPage
        cta={{ title: cta.title, text: cta.text, label: cta.primaryLabel, url: cta.primaryUrl }}
        post={post}
      />
    </Shell>
  )
}
