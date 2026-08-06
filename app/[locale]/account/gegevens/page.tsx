import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { AccountNav } from '@/components/commerce/AccountNav'
import { ProfileForm } from '@/components/commerce/ProfileForm'
import { LocaleLink } from '@/components/LocaleLink'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getAccountSession, loginPath } from '@/lib/commerce/account'
import { commerceEnabled } from '@/lib/commerce/config'

/** /account/gegevens — naam, telefoonnummer en nieuwsbriefkeuze. */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function AccountDetailsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  const session = await getAccountSession()
  if (!session) redirect(`/${locale}${loginPath('/account/gegevens')}`)

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={ui.accountDetails} eyebrow="" text="" title={ui.accountDetails} />
      <section className="section">
        <div className="container">
          <div className="account-layout">
            <AccountNav active="details" email={session.customer.email} ui={ui} />
            <div className="account-main">
              <ProfileForm customer={session.customer} ui={ui} />

              {/* Wachtwoord wijzigen loopt via het herstelpad: dat heeft al een bevestiging per mail,
                  dus een eigen formulier hier zou een tweede, zwakkere weg naar hetzelfde zijn. */}
              <p className="account-note">
                <LocaleLink href="/account/wachtwoord-vergeten">{ui.forgotPassword}</LocaleLink>
              </p>
            </div>
          </div>
        </div>
      </section>
    </Shell>
  )
}
