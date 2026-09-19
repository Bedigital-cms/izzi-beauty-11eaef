import type { MetadataRoute } from 'next'

import { getPublishedPosts } from '@/content/blog'
import { getInfo } from '@/content/info'
import { getLegalSlugs } from '@/content/legal'
import { getLocatieSlugs } from '@/content/locaties'
import { getServiceSlugs } from '@/content/services'
import { getTrainingSlugs } from '@/content/trainings-detail'
import { activeLocales, defaultLocale, hideDefaultPrefix } from '@/lib/i18n'
import { SITE_URL, localePathname } from '@/lib/seo'

/**
 * Production sitemap: every INDEXABLE public URL, for each active locale (EN clean, NL /nl once
 * bilingual). Excludes private/functional routes (preview, account, cart, checkout, order, product,
 * winkel) and drafts (uses getPublishedPosts). Hreflang is handled in per-page HTML metadata
 * (lib/seo.ts), so it is intentionally not duplicated here.
 *
 * Fixed public paths that genuinely exist as routes are listed explicitly; collection detail pages
 * (treatments, trainings, locations, published articles) and info/legal pages are enumerated from
 * content so the sitemap tracks the CMS without manual edits.
 */
// Nested info keys served from a multi-segment path (see ai-guide); everything else is flat "/<key>".
const NESTED_INFO: Record<string, string> = {
  'veelgesteldevragen-lippen': '/pmu-opleiding-lippen/veelgesteldevragen-lippen',
  'online-trainingen-veelgestelde-vragen': '/online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen',
}

const FIXED_PATHS = [
  '/',
  '/behandelingen',
  '/opleidingen',
  '/online-trainingen',
  '/kennisbank',
  '/blog',
  '/prijzen',
  '/over-izzi',
  '/portfolio',
  '/contact',
  '/onze-locaties',
]

function prefixFreePaths(locale: string): string[] {
  const paths = new Set<string>(FIXED_PATHS)
  for (const s of getServiceSlugs(locale)) paths.add(`/${s}`)
  for (const s of getTrainingSlugs(locale)) paths.add(`/${s}`)
  for (const s of getLocatieSlugs(locale)) paths.add(`/${s}`)
  for (const s of Object.keys(getPublishedPosts(locale))) paths.add(`/${s}`)
  for (const s of getLegalSlugs(locale)) paths.add(`/${s}`)
  // Info pages: fixed route per key, with two nested exceptions. /ervaringen only when it has content.
  for (const key of Object.keys(getInfo(locale))) paths.add(NESTED_INFO[key] ?? `/${key}`)
  return [...paths]
}

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = activeLocales()
  const def = defaultLocale()
  const hide = hideDefaultPrefix()
  const seen = new Set<string>()
  const entries: MetadataRoute.Sitemap = []
  for (const locale of locales) {
    for (const p of prefixFreePaths(locale)) {
      const url = `${SITE_URL}${localePathname(locale, p, { defaultLocale: def, hideDefaultPrefix: hide })}`
      if (seen.has(url)) continue
      seen.add(url)
      entries.push({ url })
    }
  }
  return entries
}
