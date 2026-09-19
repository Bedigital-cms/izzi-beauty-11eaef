/**
 * Page-specific localized SEO metadata (canonical + reciprocal hreflang), fully-qualified.
 *
 * The site-wide layout only emits root-level hreflang; that is not enough for a bilingual site where
 * every page needs alternates that point at the SAME page in each language. This helper builds, for a
 * prefix-free content path (e.g. "/powder-brows"), the absolute canonical for the current locale and
 * the reciprocal hreflang set for every active locale — so EN canonicalises to EN and NL to NL
 * (never cross-language), with x-default pointing at the English (default) equivalent.
 *
 * The core is a PURE function (`buildAlternates`) so it is unit-testable without activating i18n;
 * `pageAlternates` is the server wrapper that reads the live i18n config.
 *
 * Server-only (reads lib/i18n which reads the filesystem).
 */
import type { Metadata } from 'next'

import { activeLocales, defaultLocale, hideDefaultPrefix } from './i18n'

/** Canonical production origin (no trailing slash). Overridable via env for preview/staging. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://izzi-beauty.com').replace(/\/+$/, '')

/** Normalise a content path to a prefix-free, leading-slash path ("/", "/powder-brows"). */
function normalizePath(path: string): string {
  if (!path || path === '/') return '/'
  return path.startsWith('/') ? path.replace(/\/+$/, '') : `/${path}`.replace(/\/+$/, '')
}

/** The locale-specific URL PATH for a prefix-free path (respecting the hidden default prefix). */
export function localePathname(
  locale: string,
  path: string,
  opts: { defaultLocale: string; hideDefaultPrefix: boolean },
): string {
  const p = normalizePath(path)
  const clean = opts.hideDefaultPrefix && locale === opts.defaultLocale
  if (clean) return p
  return p === '/' ? `/${locale}` : `/${locale}${p}`
}

export type AlternatesInput = {
  siteUrl: string
  locales: string[]
  defaultLocale: string
  hideDefaultPrefix: boolean
  /** The locale of the page whose metadata we're building. */
  locale: string
  /** Prefix-free content path, e.g. "/powder-brows" or "/". */
  path: string
}

export type BuiltAlternates = {
  canonical: string
  languages?: Record<string, string>
  xDefault?: string
}

/**
 * PURE: build the absolute canonical + reciprocal hreflang set. EN→EN, NL→NL (self-canonical, never
 * cross-language). `languages` maps each active locale to the absolute URL of the SAME page in that
 * language. `xDefault` = the default-locale equivalent. Single-locale sites get a self-canonical and
 * no alternates (hreflang is meaningless with one language).
 */
export function buildAlternates(input: AlternatesInput): BuiltAlternates {
  const { siteUrl, locales, defaultLocale: def, hideDefaultPrefix: hide, locale, path } = input
  const abs = (loc: string) => `${siteUrl}${localePathname(loc, path, { defaultLocale: def, hideDefaultPrefix: hide })}`
  const canonical = abs(locale)
  if (locales.length < 2) return { canonical }
  const languages: Record<string, string> = {}
  for (const l of locales) languages[l] = abs(l)
  return { canonical, languages, xDefault: abs(def) }
}

/**
 * Server wrapper: read the live i18n config and return a Next `Metadata["alternates"]` object for a
 * prefix-free content path in the given locale. Use inside a route's `generateMetadata`:
 *   return { ...meta, alternates: pageAlternates('/powder-brows', locale) }
 */
export function pageAlternates(path: string, locale: string): NonNullable<Metadata['alternates']> {
  const built = buildAlternates({
    siteUrl: SITE_URL,
    locales: activeLocales(),
    defaultLocale: defaultLocale(),
    hideDefaultPrefix: hideDefaultPrefix(),
    locale,
    path,
  })
  return {
    canonical: built.canonical,
    ...(built.languages ? { languages: { ...built.languages, ...(built.xDefault ? { 'x-default': built.xDefault } : {}) } } : {}),
  }
}
