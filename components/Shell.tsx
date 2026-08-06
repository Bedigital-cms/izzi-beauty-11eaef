import type { ReactNode } from 'react'

import { getShopUI } from '@/content/shop'
import { getSite } from '@/content/site'
import { defaultLocale, hideDefaultPrefix } from '@/lib/i18n'

import { CommerceBoundary } from './commerce/CommerceBoundary'
import { Footer } from './Footer'
import { Header } from './Header'
import { LocaleProvider } from './LocaleLink'

/** Standard page frame: sticky header + page content + footer. Interior pages wrap their
 *  sections in <Shell locale={locale}>…</Shell>. (The home page composes Header/Footer itself
 *  for its bespoke hero layout — it wraps them in <CommerceBoundary> too.) The LocaleProvider makes
 *  the locale + routing config available to every LocaleLink below, so nav/footer/section links get
 *  the right prefix (or none, for the default language when hideDefaultPrefix is on).
 *
 *  CommerceBoundary voegt de winkelwagen-context toe — maar alleen bij tenants met een webshop, zodat
 *  een gewone contentsite er niets van merkt. */
export function Shell({ locale, children }: { locale: string; children: ReactNode }) {
  const site = getSite(locale)
  return (
    <LocaleProvider locale={locale} defaultLocale={defaultLocale()} hideDefaultPrefix={hideDefaultPrefix()}>
      <CommerceBoundary>
        <Header
          accountLabel={getShopUI(locale).myAccount}
          cartLabel={getShopUI(locale).cartTitle}
          site={site}
          locale={locale}
        />
        <main>{children}</main>
        <Footer site={site} />
      </CommerceBoundary>
    </LocaleProvider>
  )
}
