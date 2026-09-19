import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import Integrations from '@/components/Integrations'
import { getSite } from '@/content/site'
import { activeLocales } from '@/lib/i18n'
import { isActiveLocale } from '@/lib/i18n'
import { localeDir } from '@/lib/locales'
import { SITE_URL } from '@/lib/seo'

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
  // NB: the layout deliberately does NOT set `alternates` anymore. Root-level hreflang here leaked
  // onto every sub-page (e.g. EN /contact getting hreflang nl → /nl instead of /nl/contact). Each
  // indexable page now sets its OWN page-specific canonical + reciprocal hreflang via
  // pageAlternates() (lib/seo.ts). The layout only provides metadataBase + default title/description.
  return {
    metadataBase: new URL(SITE_URL),
    title: `${site.brandName} — ${site.tagline}`,
    description: site.footer.about,
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
        <Integrations position="head" />
      </head>
      <body>
        {children}
        <Integrations position="body-end" />
      </body>
    </html>
  )
}
