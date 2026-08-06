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
 * /account/inloggen — inlogformulier.
 *
 * `?next=` is de terugweg: het afrekenen stuurt hier naartoe met `next=/afrekenen`, zodat de bezoeker
 * na het inloggen weer in zijn afrekenproces staat en niet op een accountpagina. Alleen paden op deze
 * site worden geaccepteerd (`safeNextPath`) — anders is dit een open redirect.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function LoginPage({
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

  // Al ingelogd? Dan heeft dit formulier geen functie meer.
  const session = await getAccountSession()
  if (session) redirect(`/${locale}${safeNextPath(next)}`)

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={shop.ui.login} eyebrow="" text="" title={shop.ui.loginTitle} />
      <section className="section">
        <div className="container container--narrow">
          <AuthForm mode="login" next={next} ui={shop.ui} />
        </div>
      </section>
    </Shell>
  )
}
