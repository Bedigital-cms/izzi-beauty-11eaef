/**
 * Machine-readable EN/NL route inventory for pre-live bilingual QA.
 * Does not mutate i18n.json. Computes production (NL-only) and simulated bilingual URLs.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const SITE = 'https://izzi-beauty.com'

function localePathname(locale, p, { defaultLocale, hideDefaultPrefix }) {
  const n = !p || p === '/' ? '/' : p.startsWith('/') ? p.replace(/\/+$/, '') : `/${p}`.replace(/\/+$/, '')
  const clean = hideDefaultPrefix && locale === defaultLocale
  if (clean) return n
  return n === '/' ? `/${locale}` : `/${locale}${n}`
}

function abs(locale, p, cfg) {
  return `${SITE}${localePathname(locale, p, cfg)}`
}

const NESTED_INFO = {
  'veelgesteldevragen-lippen': '/pmu-opleiding-lippen/veelgesteldevragen-lippen',
  'online-trainingen-veelgestelde-vragen': '/online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen',
}
const FIXED = [
  '/', '/behandelingen', '/opleidingen', '/online-trainingen', '/kennisbank', '/blog',
  '/prijzen', '/over-izzi', '/portfolio', '/contact', '/onze-locaties',
]
const LEGAL = ['/algemene-voorwaarden', '/privacy-verklaring', '/opleidingen-voorwaarden']

const nlInfo = rd('content/nl/info.json')
const posts = rd('content/nl/blog.json').posts
const services = Object.keys(rd('content/nl/services.json'))
const trainings = Object.keys(rd('content/nl/trainings-detail.json'))
const locaties = Object.keys(rd('content/nl/locaties.json'))
const infoKeys = Object.keys(nlInfo)
const published = Object.entries(posts).filter(([, p]) => p.status !== 'draft').map(([s]) => s)
const cats = [...new Set(Object.values(posts).map((p) => p.category).filter(Boolean))]
const categorySlug = (name) => name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

const sitemapPaths = [
  ...FIXED.map((p) => ({ group: p === '/' ? 'homepage' : 'hub', path: p })),
  ...services.map((s) => ({ group: 'treatment', path: `/${s}` })),
  ...trainings.map((s) => ({ group: 'training', path: `/${s}` })),
  ...locaties.map((s) => ({ group: 'location', path: `/${s}` })),
  ...infoKeys.map((k) => ({ group: 'info', path: NESTED_INFO[k] ?? `/${k}` })),
  ...published.map((s) => ({ group: 'article', path: `/${s}` })),
]
const extraCrawl = [
  ...cats.map((c) => ({ group: 'kb-category', path: `/kennisbank/${categorySlug(c)}` })),
  ...[2, 3, 4, 5].map((n) => ({ group: 'blog-page', path: `/blog/page/${n}` })),
]
const indexable = [...sitemapPaths, ...extraCrawl]
// Dedup paths (blog listed in FIXED and blog-index)
const seenPath = new Set()
const unique = []
for (const row of indexable) {
  if (seenPath.has(row.path)) continue
  seenPath.add(row.path)
  unique.push(row)
}

const bilingual = { defaultLocale: 'en', hideDefaultPrefix: true }

function rowFor(item) {
  const en = abs('en', item.path, bilingual)
  const nl = abs('nl', item.path, bilingual)
  return {
    group: item.group,
    path: item.path,
    enExists: true,
    nlExists: true,
    enUrl: en,
    nlUrl: nl,
    enUsesEnPrefix: en.includes('/en/') || en === `${SITE}/en`,
    nlUsesNlPrefix: nl.startsWith(`${SITE}/nl`),
    canonicalEn: en,
    canonicalNl: nl,
    hreflangEn: en,
    hreflangNl: nl,
    xDefault: en,
    legal: false,
    draft: false,
  }
}

const routes = unique.map(rowFor)
const legalRows = LEGAL.map((p) => ({
  group: 'legal',
  path: p,
  enExists: false,
  nlExists: true,
  enUrl: abs('en', p, bilingual),
  nlUrl: abs('nl', p, bilingual),
  indexable: false,
  reason: 'BLOCKED_CUSTOMER_LEGAL',
}))

const biEn = routes.map((r) => r.enUrl)
const biNl = routes.map((r) => r.nlUrl)
const biAll = [...biEn, ...biNl]
const dupes = biAll.filter((u, i) => biAll.indexOf(u) !== i)
const enPrefixed = biEn.filter((u) => /\/en(\/|$)/.test(u.replace(SITE, '')))

const inventory = {
  generatedAt: '2026-09-19',
  siteUrl: SITE,
  productionConfig: { enabled: false, defaultLocale: 'nl', locales: ['nl'], hideDefaultPrefix: false },
  simulatedActivation: { enabled: true, defaultLocale: 'en', locales: ['en', 'nl'], hideDefaultPrefix: true },
  counts: {
    indexablePaths: unique.length,
    treatments: services.length,
    trainings: trainings.length,
    locations: locaties.length,
    info: infoKeys.length,
    articles: published.length,
    kbCategories: cats.length,
      productionSitemapUrls: unique.filter((r) => r.group !== 'blog-page' && r.group !== 'kb-category').length,
      bilingualEnSitemapUrls: routes.filter((r) => r.group !== 'blog-page' && r.group !== 'kb-category').length,
      bilingualNlSitemapUrls: routes.filter((r) => r.group !== 'blog-page' && r.group !== 'kb-category').length,
      bilingualSitemapTotal: routes.filter((r) => r.group !== 'blog-page' && r.group !== 'kb-category').length * 2,
      bilingualEnUrls: biEn.length,
      bilingualNlUrls: biNl.length,
      bilingualTotal: biAll.length,
    excludedLegal: LEGAL.length,
    bilingualEnWithEnPrefix: enPrefixed.length,
    bilingualDuplicates: [...new Set(dupes)].length,
  },
  groups: Object.fromEntries(
    [...new Set(routes.map((r) => r.group))].map((g) => [g, routes.filter((r) => r.group === g).length]),
  ),
  routes,
  legal: legalRows,
  notes: [
    'Legal is listed but not indexable and not in sitemap.',
    '/ervaringen is absent from info.json (route 404s until CMS content exists) and is not in this inventory.',
    'Production sitemap uses NL-only prefixed URLs.',
    'Simulated bilingual sitemap must use clean EN root + /nl prefix, never /en.',
  ],
}

const out = path.join(ROOT, 'docs/pre-live-route-inventory.json')
fs.writeFileSync(out, JSON.stringify(inventory, null, 2) + '\n')
console.log(JSON.stringify(inventory.counts, null, 2))
console.log('wrote', out)
