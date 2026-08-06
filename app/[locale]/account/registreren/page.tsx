import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { AuthForm } from '@/components/commerce/AuthForm'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getAccountSession } from '@/lib/commerce/account'
import { commerceEnabled } from '@/lib/commerce/config'
import { safeNextPath } from '@/lib/commerce/format'

/**
 * /account/registreren — account aanmaken.
 *
 * Registreren logt meteen in (het CMS geeft direct een sessietoken terug), zodat de bezoeker zijn
 * wachtwoord niet twee keer hoeft in te typen. Zat er al iets in zijn winkelwagen, dan wordt die
 * gastwagen bij het aanmaken aan het nieuwe account gekoppeld — anders verliest hij zijn selectie op
 * het moment dat hij besluit klant te worden.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const { locale } = await params
  const { next } = await searchParams
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)

  const session = await getAccountSession()
  if (session) redirect(`/${locale}${safeNextPath(next)}`)

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={shop.ui.register} eyebrow="" text="" title={shop.ui.registerTitle} />
      <section className="section">
        <div className="container container--narrow">
          <AuthForm mode="register" next={next} ui={shop.ui} />
        </div>
      </section>
    </Shell>
  )
}
