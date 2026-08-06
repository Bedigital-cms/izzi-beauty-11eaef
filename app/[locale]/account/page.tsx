import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { AccountNav } from '@/components/commerce/AccountNav'
import { OrderHistory } from '@/components/commerce/OrderHistory'
import { LocaleLink } from '@/components/LocaleLink'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getAccountSession, getOrders, loginPath } from '@/lib/commerce/account'
import { commerceEnabled } from '@/lib/commerce/config'

/**
 * /account — overzicht van het klantaccount.
 *
 * Altijd dynamisch en nooit indexeren: dit is een persoonlijke pagina achter een sessiecookie. Zou hij
 * geprerenderd worden, dan zou de eerste bezoeker zijn gegevens aan alle volgende laten zien.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

/** Hoeveel bestellingen op het overzicht passen voordat "alle bestellingen" zinvol wordt. */
const RECENT_LIMIT = 3

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  const session = await getAccountSession()
  if (!session) redirect(`/${locale}${loginPath('/account')}`)

  const { orders, total } = await getOrders(session.token)
  const recent = orders.slice(0, RECENT_LIMIT)

  const name = [session.customer.firstName, session.customer.lastName].filter(Boolean).join(' ')

  return (
    <Shell locale={locale}>
      <PageHero
        breadcrumb={ui.myAccount}
        eyebrow=""
        text={ui.accountIntro}
        title={name ? `${ui.myAccount} — ${name}` : ui.myAccount}
      />
      <section className="section">
        <div className="container">
          <div className="account-layout">
            <AccountNav active="overview" email={session.customer.email} ui={ui} />

            <div className="account-main">
              <div className="account-block">
                <h2>{ui.recentOrders}</h2>
                <OrderHistory locale={locale} orders={recent} ui={ui} />
                {total > recent.length && (
                  <LocaleLink className="link-arrow" href="/account/bestellingen">
                    {ui.viewAllOrders}
                  </LocaleLink>
                )}
              </div>

              <div className="account-block">
                <h2>{ui.accountDetails}</h2>
                <p className="account-summary">
                  {[name, session.customer.email, session.customer.phone].filter(Boolean).join(' · ')}
                </p>
                <LocaleLink className="link-arrow" href="/account/gegevens">
                  {ui.edit}
                </LocaleLink>
              </div>

              <div className="account-block">
                <h2>{ui.accountAddresses}</h2>
                <LocaleLink className="link-arrow" href="/account/adressen">
                  {ui.savedAddresses}
                </LocaleLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  )
}
