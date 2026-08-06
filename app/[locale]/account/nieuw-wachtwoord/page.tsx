import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { AuthForm } from '@/components/commerce/AuthForm'
import { LocaleLink } from '@/components/LocaleLink'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { commerceEnabled } from '@/lib/commerce/config'

/**
 * /account/nieuw-wachtwoord?token=… — nieuw wachtwoord instellen.
 *
 * Hier komt de bezoeker vanuit de herstelmail; het `token` in de URL is het bewijs dat hij de mailbox
 * kan lezen. Deze pagina controleert het token NIET vooraf: dat kan alleen door het te verzilveren, en
 * een "geldig"-controle vooraf zou het token verbruiken vóórdat er een nieuw wachtwoord is. Een
 * verlopen of al gebruikte link geeft daarom pas bij het opslaan een melding — met de weg naar een
 * nieuwe aanvraag.
 *
 * Nooit indexeren: er staat een geldig hersteltoken in deze URL.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

export default async function NewPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { locale } = await params
  const { token } = await searchParams
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={ui.resetTitle} eyebrow="" text="" title={ui.resetTitle} />
      <section className="section">
        <div className="container container--narrow">
          {token ? (
            <AuthForm mode="reset" token={token} ui={ui} />
          ) : (
            // Zonder token valt er niets in te stellen. Geen foutmelding met details: de bezoeker komt
            // hier via een geknipte of afgekapte link uit zijn mail.
            <div className="auth-card">
              <p className="form-error" role="alert">
                Deze herstel-link is niet (meer) geldig. Vraag een nieuwe aan.
              </p>
              <LocaleLink className="btn btn-gold" href="/account/wachtwoord-vergeten">
                {ui.forgotTitle}
              </LocaleLink>
            </div>
          )}
        </div>
      </section>
    </Shell>
  )
}
