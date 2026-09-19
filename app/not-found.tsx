import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LocaleLink, LocaleProvider } from '@/components/LocaleLink'
import { getSite } from '@/content/site'
import { getUI } from '@/content/ui'
import { defaultLocale, hideDefaultPrefix } from '@/lib/i18n'
import { localeDir } from '@/lib/locales'

/**
 * Global 404. Because the root layout is a pass-through (the real <html> lives in
 * app/[locale]/layout.tsx), this page renders its own <html>/<body>. It falls back to the
 * site's default locale for the header/footer chrome and shared 404 labels.
 */
export default function NotFound() {
  const locale = defaultLocale()
  const site = getSite(locale)
  const copy = getUI(locale).notFound
  return (
    <html lang={locale} dir={localeDir(locale)}>
      <body>
        <LocaleProvider locale={locale} defaultLocale={locale} hideDefaultPrefix={hideDefaultPrefix()}>
          <Header site={site} locale={locale} />
          <section className="pagehero">
            <div className="container">
              <div className="pagehero-inner">
                <span className="eyebrow">404</span>
                <h1>{copy.title}</h1>
                <p>{copy.text}</p>
                <div style={{ marginTop: 30, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <LocaleLink className="btn btn-gold" href="/">{copy.home}</LocaleLink>
                  <LocaleLink className="btn btn-light" href="/behandelingen">{copy.treatments}</LocaleLink>
                </div>
              </div>
            </div>
          </section>
          <Footer site={site} />
        </LocaleProvider>
      </body>
    </html>
  )
}
