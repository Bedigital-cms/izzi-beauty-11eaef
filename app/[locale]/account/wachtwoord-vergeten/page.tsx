import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AuthForm } from '@/components/commerce/AuthForm'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { commerceEnabled } from '@/lib/commerce/config'

/**
 * /account/wachtwoord-vergeten — herstel aanvragen.
 *
 * Het antwoord is ALTIJD hetzelfde, of het e-mailadres bekend is of niet. Anders is dit formulier een
 * hulpmiddel om te achterhalen wie klant is. Geen redirect voor een al ingelogde bezoeker: wie zijn
 * wachtwoord kwijt is terwijl hij nog ingelogd is, mag het gewoon opnieuw instellen.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function ForgotPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={shop.ui.forgotTitle} eyebrow="" text="" title={shop.ui.forgotTitle} />
      <section className="section">
        <div className="container container--narrow">
          <AuthForm mode="forgot" ui={shop.ui} />
        </div>
      </section>
    </Shell>
  )
}
