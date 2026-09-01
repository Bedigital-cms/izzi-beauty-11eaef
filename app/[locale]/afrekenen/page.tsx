import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { CheckoutForm } from '@/components/commerce/CheckoutForm'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getAccountSession, getAddresses } from '@/lib/commerce/account'
import { getCart, getShippingMethods, getShopConfig } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import { readCartToken } from '@/lib/commerce/session'

/** Altijd dynamisch en nooit indexeren: dit is een persoonlijke pagina met een winkelwagen erin. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const token = await readCartToken()

  // Zonder winkelwagen valt er niets af te rekenen → terug naar de winkel.
  if (!token) redirect(`/${locale}/winkel`)

  const cartResult = await getCart(token)
  if (!cartResult.ok || cartResult.data.cart.itemCount === 0) {
    redirect(`/${locale}/winkelwagen`)
  }

  const cart = cartResult.data.cart

  /*
   * Verzendmethoden voor Nederland als vertrekpunt; het formulier haalt ze opnieuw op als de bezoeker
   * een ander land kiest.
   *
   * Korting en gewicht gaan mee omdat ze het TARIEF bepalen: het CMS toetst een drempel voor gratis
   * verzending aan het subtotaal ná korting, en een gewichtsstaffel aan het gewicht. Zonder die twee
   * toonde deze lijst een lager bedrag dan de bezoeker even later afrekende. Zie `onCountryChange` in
   * CheckoutForm.tsx.
   */
  const methodsResult = await getShippingMethods({
    country: 'NL',
    subtotalCents: cart.subtotalCents,
    discountCents: cart.discountCents,
    weightGrams: cart.totalWeightGrams ?? 0,
  })

  /*
   * De webshopconfiguratie, hier alleen nodig voor de in3-grenzen.
   *
   * Mislukt deze aanroep, dan gaat het afrekenen gewoon door zonder betaalkeuze: Mollie bepaalt dan
   * zelf het menu, precies zoals vóór deze stap. Een onbereikbare configuratie hoort geen afrekenen
   * te blokkeren — er valt zonder die grenzen alleen niets uit te leggen.
   */
  const configResult = await getShopConfig()
  const in3Limits = configResult.ok ? (configResult.data.in3 ?? null) : null

  /*
   * Is er iemand ingelogd? Dan komen zijn adressen mee, zodat het formulier ze meteen kan invullen.
   * Zonder sessie blijft dit `null` en een lege lijst: afrekenen als gast verandert hierdoor niets — er
   * wordt nergens naar een account gevraagd.
   */
  const session = await getAccountSession()
  const addresses = session ? await getAddresses(session.token) : []

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={shop.ui.checkoutTitle} eyebrow="" text="" title={shop.ui.checkoutTitle} />
      <section className="section">
        <div className="container">
          <CheckoutForm
            addresses={addresses}
            customer={session?.customer ?? null}
            in3Limits={in3Limits}
            initialCart={cart}
            methods={methodsResult.ok ? methodsResult.data.methods : []}
            ui={shop.ui}
          />
        </div>
      </section>
    </Shell>
  )
}
