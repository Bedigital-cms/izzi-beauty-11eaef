import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { AccountNav } from '@/components/commerce/AccountNav'
import { AddressBook } from '@/components/commerce/AddressBook'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getAccountSession, getAddresses, loginPath } from '@/lib/commerce/account'
import { commerceEnabled } from '@/lib/commerce/config'

/**
 * /account/adressen — adresboek.
 *
 * De lijst komt server-side mee als beginwaarde; daarna beheert het component hem zelf, zodat een
 * verwijderd adres meteen weg is. Een adres wijzigen verandert nooit een oude bestelling: die heeft het
 * adres als momentopname gekopieerd.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function AccountAddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  const session = await getAccountSession()
  if (!session) redirect(`/${locale}${loginPath('/account/adressen')}`)

  const addresses = await getAddresses(session.token)

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={ui.accountAddresses} eyebrow="" text="" title={ui.accountAddresses} />
      <section className="section">
        <div className="container">
          <div className="account-layout">
            <AccountNav active="addresses" email={session.customer.email} ui={ui} />
            <div className="account-main">
              <AddressBook initial={addresses} ui={ui} />
            </div>
          </div>
        </div>
      </section>
    </Shell>
  )
}
