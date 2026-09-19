/**
 * Shared UI labels for the generic renderers/routes (location card, blog + knowledge-base chrome,
 * pagination, the generated "onze-locaties" hub, category display labels, related-link labels).
 *
 * Same idea as `content/shop.ts`: a built-in Dutch default so the site always renders, plus a
 * per-locale `content/<locale>/ui.json` that overrides it. Missing keys fall back to the default
 * PER FIELD, so a half-translated ui.json never yields blank labels. Adding a language is pure
 * data: drop a `content/<code>/ui.json`. No component edits.
 *
 * Ambient locale: server components deep in the tree (Pagination, BlogCard, the location card, …)
 * need the active locale without prop-drilling it through every layer. `setActiveLocale()` records
 * it once per request (React `cache()` = per-render scope) at the top of the locale layout + page
 * shells; `ui()` / `getActiveLocale()` read it back. This mirrors how the client side already gets
 * the locale from <LocaleProvider>. Server-only (reads the filesystem via loadContent).
 */
import { cache } from 'react'

import { loadContent } from '@/content/load'
import { defaultLocale } from '@/lib/i18n'
import type { Ui } from '@/lib/types'

/** Dutch defaults — the source language. A missing/partial ui.json falls back to these per field. */
const DEFAULT_UI: Ui = {
  common: {
    home: 'Home',
    readMore: 'Lees meer',
    moreInfo: 'Meer info',
    enroll: 'Inschrijven',
    starsLabel: '{n} van 5 sterren',
    reviewsLabel: 'Klantbeoordelingen',
    viewOnMap: 'Bekijk op de kaart',
    emailLabel: 'E-mail',
    phoneLabel: 'Telefoon',
  },
  location: {
    address: 'Adres',
    city: 'Plaats',
    phone: 'Telefoon',
    hours: 'Openingstijden',
  },
  blog: {
    allArticles: 'Alle artikelen',
    articlesCount: '{n} artikelen',
    pageXofY: 'pagina {x} van {y}',
    readArticle: 'Lees artikel',
    minRead: 'min lezen',
    moreOnTopic: 'Meer over dit onderwerp',
    backToBlog: 'Terug naar de blog',
    moreArticles: 'Meer artikelen',
    prevArticle: 'Vorig artikel',
    nextArticle: 'Volgend artikel',
    inThisArticle: 'In dit artikel',
    tableOfContents: 'Inhoudsopgave',
  },
  pagination: {
    label: 'Paginering',
    prev: 'Vorige',
    next: 'Volgende',
    prevPage: 'Vorige pagina',
    nextPage: 'Volgende pagina',
  },
  menu: {
    title: 'Menu',
    mainNav: 'Hoofdmenu',
    openMenu: 'Menu openen',
    closeMenu: 'Menu sluiten',
    allPrefix: 'Alle',
    language: 'Taal / Language',
  },
  kennisbank: {
    title: 'Kennisbank',
    metaDescription:
      'Alles over permanente make-up, verdeeld over {n} onderwerpen: van behandelingen en nazorg tot opleidingen.',
    eyebrow: 'Kennisbank',
    heroText: 'Alles wat je wilt weten over permanente make-up, verdeeld over onderwerpen.',
    allTopics: 'Alle onderwerpen',
    article: 'artikel',
    articles: 'artikelen',
    categoryHeroText: '{count} {articles} over dit onderwerp.',
    categoryMetaDescription: '{count} {articles} over {name}.',
  },
  onzeLocaties: {
    eyebrow: 'Over IZZI',
    title: 'Onze locaties',
    text: 'Bezoek ons in de salon of bekijk in welke plaatsen we actief zijn.',
    breadcrumb: 'Onze locaties',
    introTitle: 'Waar kun je ons vinden?',
    introText:
      'Onze salons zijn gemakkelijk bereikbaar. Daarnaast komen klanten uit de hele regio naar ons toe.',
    salonsHeading: 'Onze salons',
    areaHeading: 'Ons verzorgingsgebied',
    areaText: 'Ook uit deze plaatsen komen klanten naar onze salons.',
    ctaScript: 'Klaar voor de volgende stap?',
    ctaTitle: 'Maak vrijblijvend een afspraak',
    ctaText:
      'Tijdens een persoonlijk intakegesprek bespreken we jouw wensen en adviseren we de beste behandeling.',
    ctaPrimary: 'Afspraak maken',
    ctaSecondary: 'Neem contact op',
    viewLocation: 'Bekijk locatie',
    viewPage: 'Bekijk pagina',
  },
  contactPage: {
    locationsHeading: 'Onze locaties',
    locationsSubheading: 'Bezoek een van onze studio\u2019s',
  },
  categories: {},
  relatedLabels: {},
}

type Dict = Record<string, unknown>
const isObj = (v: unknown): v is Dict => !!v && typeof v === 'object' && !Array.isArray(v)

/** Per-field deep merge: `override` wins, but any key it omits keeps the default's value. */
function deepMerge<T>(base: T, override: unknown): T {
  if (!isObj(base) || !isObj(override)) return (override as T) ?? base
  const out: Dict = { ...base }
  for (const [k, v] of Object.entries(override)) {
    out[k] = k in base ? deepMerge((base as Dict)[k], v) : v
  }
  return out as T
}

/** Full UI labels for a locale, with every missing key filled from the Dutch default. */
export function getUI(locale: string): Ui {
  let loaded: unknown = null
  try {
    loaded = loadContent<Ui>('ui', locale)
  } catch {
    loaded = null
  }
  return deepMerge(DEFAULT_UI, loaded)
}

/* --------------------------- ambient (request-scoped) locale --------------------------- */

/** Per-request holder (React `cache()` gives one instance per render pass). */
const localeHolder = cache((): { code: string } => ({ code: defaultLocale() }))

/** Record the active locale for the current render (call once at the top of a layout/shell). */
export function setActiveLocale(locale: string): void {
  localeHolder().code = locale
}

/** The active locale recorded for this render, or the site default. */
export function getActiveLocale(): string {
  return localeHolder().code
}

/** Shared UI labels for the ambient active locale. */
export function ui(): Ui {
  return getUI(getActiveLocale())
}

/** Localized display label for a stable knowledge-base category key (falls back to the key). */
export function categoryLabel(locale: string, key: string): string {
  return getUI(locale).categories[key] ?? key
}

/** Replace `{token}` placeholders in a label. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? ''))
}
