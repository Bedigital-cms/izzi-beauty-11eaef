import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Shell } from '@/components/Shell'
import { BlogPostPage, DetailPage, LocationPage, PageHero } from '@/components/sections'
import { getBlogIndex, getPosts, getPostSlugs, getPublishedPosts } from '@/content/blog'
import { getLocaties, getLocatieSlugs } from '@/content/locaties'
import { getServices, getServiceSlugs } from '@/content/services'
import { getTrainingsDetail, getTrainingSlugs } from '@/content/trainings-detail'
import { commerceRouteSegments } from '@/lib/commerce/config'
import { activeLocales } from '@/lib/i18n'

/**
 * Flat, content-driven detail route: /<locale>/<slug>.
 *
 * Every detail page (treatments, trainings, city-landing pages, blog posts) lives directly under the
 * locale — NO category prefix (so /nl/lip-blush instead of /nl/behandelingen/lip-blush). A slug is
 * resolved by looking it up, in order, across the content collections; the first match decides how it
 * renders. Static pages (prijzen, contact, over-izzi, the behandelingen/opleidingen/blog hubs, …) keep
 * their own named folders and always win over this dynamic segment.
 *
 * Because there is now a single flat namespace, every slug must be GLOBALLY UNIQUE and must not equal a
 * reserved static-route name. `generateStaticParams` enforces this at build time (it throws with a
 * clear message) so a collision can never silently serve the wrong page.
 */

/** Top-level static route segments — a content slug may never collide with one (Next resolves the
 *  static folder first, which would make the content page unreachable). */
const RESERVED = new Set([
  // Webshop-segmenten. ALTIJD gereserveerd, óók als de webshop uit staat — anders kan een redacteur
  // een pagina op /winkel aanmaken die na het aanzetten van de webshop onbereikbaar wordt (of de build
  // laat falen). `commerceRouteSegments()` is puur env-gebaseerd en gooit nooit; dat is hier essentieel,
  // want een fout in dit bestand breekt de build van élke tenant.
  ...commerceRouteSegments(),
  'behandelingen',
  'opleidingen',
  'blog',
  'online-trainingen',
  'prijzen',
  'over-izzi',
  'portfolio',
  'contact',
  'veelgestelde-vragen',
  'permanente-make-up-lippen-veelgestelde-vragen',
  'permanente-make-up-sproetjes-veelgestelde-vragen',
  'permanente-make-up-eyeliner-veelgestelde-vragen',
  // Segmenten met geneste FAQ-pagina's (zelfde URL-structuur als de oorspronkelijke site):
  // /online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen en
  // /pmu-opleiding-lippen/veelgesteldevragen-lippen.
  'online-trainingen-veelgestelde-vragen',
  'pmu-opleiding-lippen',
  'algemene-voorwaarden',
  'privacy-verklaring',
  'opleidingen-voorwaarden',
  'uwv-subsidie',
  'ggd-gecertificeerd',
  'werken-bij-izzi-beauty',
  'media',
])

type Resolved =
  | { kind: 'detail'; data: ReturnType<typeof getServices>[string] }
  | { kind: 'location'; data: ReturnType<typeof getLocaties>[string] }
  | { kind: 'post'; data: ReturnType<typeof getPosts>[string] }

/** Find which collection owns `slug` (first match wins; slugs are guaranteed unique by the guard). */
function resolvePage(locale: string, slug: string): Resolved | null {
  const svc = getServices(locale)[slug]
  if (svc) return { kind: 'detail', data: svc }
  const trn = getTrainingsDetail(locale)[slug]
  if (trn) return { kind: 'detail', data: trn }
  const loc = getLocaties(locale)[slug]
  if (loc) return { kind: 'location', data: loc }
  /*
   * `getPublishedPosts`, niet `getPosts`: een concept hoort hier een 404 te geven en niet stilletjes
   * te verschijnen omdat iemand de URL kent. Wie het wél moet kunnen lezen, gebruikt
   * `/preview/<slug>`.
   */
  const post = getPublishedPosts(locale)[slug]
  if (post) return { kind: 'post', data: post }
  return null
}

export function generateStaticParams() {
  const out: Array<{ locale: string; slug: string }> = []
  for (const locale of activeLocales()) {
    const groups: Array<[string, string[]]> = [
      ['behandeling', getServiceSlugs(locale)],
      ['opleiding', getTrainingSlugs(locale)],
      ['locatie', getLocatieSlugs(locale)],
      ['blog', getPostSlugs(locale)],
    ]
    const seen = new Map<string, string>()
    for (const [kind, slugs] of groups) {
      for (const slug of slugs) {
        if (RESERVED.has(slug)) {
          throw new Error(
            `[flat-routes] Slug "${slug}" (${kind}, ${locale}) collides with a reserved static route. ` +
              `Rename it in the content so flat URLs stay unambiguous.`,
          )
        }
        const prev = seen.get(slug)
        if (prev) {
          throw new Error(
            `[flat-routes] Duplicate slug "${slug}" in "${locale}": used by both ${prev} and ${kind}. ` +
              `With flat URLs (/<locale>/<slug>) every slug must be globally unique — rename one of them ` +
              `(and add a redirect from the old URL).`,
          )
        }
        seen.set(slug, kind)
        out.push({ locale, slug })
      }
    }
  }
  return out
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const page = resolvePage(locale, slug)
  if (!page) return { title: 'Niet gevonden — IZZI Beauty' }
  if (page.kind === 'post') {
    // Blogposts dragen de SEO-titel/description van de oorspronkelijke WordPress-post mee, zodat de
    // gemigreerde URLs hun bestaande posities houden. `seoTitle` is een volledige titel — daar zetten
    // we GEEN merknaam achter (die staat er meestal al in). Zonder die velden vallen we terug op de
    // artikeltitel + excerpt.
    const { seoTitle, seoDescription, title, excerpt } = page.data
    return {
      title: seoTitle || `${title} — IZZI Beauty`,
      description: seoDescription || excerpt,
    }
  }
  return { title: `${page.data.hero.title} — IZZI Beauty`, description: page.data.hero.text }
}

export default async function FlatDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const page = resolvePage(locale, slug)
  if (!page) notFound()

  if (page.kind === 'detail') {
    return (
      <Shell locale={locale}>
        <DetailPage data={page.data} />
      </Shell>
    )
  }
  if (page.kind === 'location') {
    return (
      <Shell locale={locale}>
        <LocationPage data={page.data} />
      </Shell>
    )
  }

  // Blog post — editorial article layout (BlogPostPage) under the shared page hero.
  const post = page.data

  // Neighbours for the prev/next cards, using the same newest-first order as the blog index.
  const posts = getPosts(locale)
  const ordered = getPostSlugs(locale).sort((a, b) => (posts[b].date ?? '').localeCompare(posts[a].date ?? ''))
  const at = ordered.indexOf(slug)
  const neighbour = (i: number) => {
    const s = ordered[i]
    return s ? { slug: s, title: posts[s].title } : undefined
  }

  // Reuse the blog index's CTA copy so the booking prompt stays consistent across the section.
  const { cta } = getBlogIndex(locale)

  return (
    <Shell locale={locale}>
      <PageHero eyebrow={post.category || 'Blog'} title={post.title} text={post.excerpt} breadcrumb={post.title} />
      <BlogPostPage
        post={post}
        prev={at > 0 ? neighbour(at - 1) : undefined}
        next={at >= 0 ? neighbour(at + 1) : undefined}
        cta={{ title: cta.title, text: cta.text, label: cta.primaryLabel, url: cta.primaryUrl }}
      />
    </Shell>
  )
}
