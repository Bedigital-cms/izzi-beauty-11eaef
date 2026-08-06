import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { getSite } from '@/content/site'
import { activeLocales, defaultLocale, domainLocaleMode, domainLocaleMap, hideDefaultPrefix } from '@/lib/i18n'
import { isActiveLocale } from '@/lib/i18n'
import { localeDir } from '@/lib/locales'

const FONTS =
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Marcellus&family=Inter:wght@300;400;500;600;700&display=swap'

/** Pre-render one tree per active locale. */
export function generateStaticParams() {
  return activeLocales().map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!isActiveLocale(locale)) return {}
  const site = getSite(locale)
  const locales = activeLocales()
  // hreflang alternates for SEO — only meaningful once >1 locale is active.
  //  · Per-domain mode: each language lives on its OWN domain, so alternates are ABSOLUTE per-domain
  //    root URLs (https://casabase.nl/, https://casabase.de/) — root-relative paths can't cross
  //    domains. Built from the host→locale map (reversed to locale→host).
  //  · Otherwise: root-relative alternates (/nl, /fr, …) that work on any host without hardcoding a
  //    domain; when the default language has a hidden prefix its alternate is the clean root ("/").
  const hideDefault = hideDefaultPrefix()
  const def = defaultLocale()
  let languages: Record<string, string> | undefined
  if (locales.length > 1) {
    if (domainLocaleMode()) {
      const localeToHost: Record<string, string> = {}
      for (const [host, loc] of Object.entries(domainLocaleMap())) if (!localeToHost[loc]) localeToHost[loc] = host
      const entries = locales.filter((l) => localeToHost[l]).map((l) => [l, `https://${localeToHost[l]}/`] as const)
      languages = entries.length > 0 ? Object.fromEntries(entries) : undefined
    } else {
      languages = Object.fromEntries(locales.map((l) => [l, hideDefault && l === def ? '/' : `/${l}`]))
    }
  }
  return {
    title: `${site.brandName} — ${site.tagline}`,
    description: site.footer.about,
    ...(languages ? { alternates: { languages } } : {}),
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  // Unknown / inactive locale in the URL → 404 (keeps /xx/... from rendering the default silently).
  if (!isActiveLocale(locale)) notFound()

  // data-scroll-behavior tells Next that the `scroll-behavior: smooth` in globals.css is
  // intentional, so it disables it for route transitions — otherwise every navigation animates the
  // scroll-to-top, which is slow and disorienting on mobile.
  return (
    <html lang={locale} dir={localeDir(locale)} data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  )
}
