import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { LocaleLink } from '@/components/LocaleLink'
import { PaymentStatus } from '@/components/commerce/PaymentStatus'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { commerceEnabled } from '@/lib/commerce/config'

/**
 * /afrekenen/bedankt — waar Mollie de klant naartoe terugstuurt.
 *
 * Deze pagina neemt NIET aan dat de betaling gelukt is. Mollie stuurt de klant terug zodra hij bij de
 * bank klaar is, mogelijk vóórdat de webhook bij het CMS is. De status wordt daarom client-side
 * gepollt (zie PaymentStatus.tsx).
 */
export const dynamic = 'force-dynamic'

// Nooit indexeren: persoonlijke pagina met een bestelnummer en een toegangstoken in de URL.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function ThankYouPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ order?: string; token?: string }>
}) {
  const { locale } = await params
  const { order, token } = await searchParams

  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  return (
    <Shell locale={locale}>
      <section className="section section-sm">
        <div className="container container--narrow">
          {order && token ? (
            <PaymentStatus orderNumber={order} token={token} ui={ui} />
          ) : (
            // Zonder bestelnummer/token kunnen we niets tonen. Geen foutmelding met details: de
            // bezoeker is hier waarschijnlijk via een oude of geknipte link.
            <div className="payment-status">
              <p className="payment-status-title">{ui.orderNotFound}</p>
              <p>
                Heb je een bestelling geplaatst? Je ontvangt een bevestiging per e-mail met een link naar
                je bestelling.
              </p>
              <LocaleLink className="btn btn-gold" href="/winkel">
                {ui.continueShopping}
              </LocaleLink>
            </div>
          )}
        </div>
      </section>
    </Shell>
  )
}
