import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { AccountNav } from '@/components/commerce/AccountNav'
import { OrderFilters } from '@/components/commerce/OrderFilters'
import { OrderHistory } from '@/components/commerce/OrderHistory'
import { LocaleLink } from '@/components/LocaleLink'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getAccountSession, getOrders, loginPath } from '@/lib/commerce/account'
import { commerceEnabled } from '@/lib/commerce/config'

/**
 * /account/bestellingen — bestel- én betaalgeschiedenis, met filters en paginering.
 *
 * De betaalstatus staat per bestelling in de lijst (zie OrderHistory.tsx). Een aparte
 * "betalingen"-pagina zou dezelfde rijen twee keer laten zien: er is per bestelling één betaling, dus
 * de betaalgeschiedenis ís deze lijst — met de betaalstatus erbij.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * DE FILTERS STAAN IN DE URL, NIET IN CLIENT-STATE
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `?from`, `?to`, `?min`, `?max` en `?sort` gaan als gewone queryparameters naar het CMS, dat ermee in
 * de database filtert. Dat levert drie dingen op die met een client-side filter niet kunnen:
 *
 *  - **de lijst is compleet.** Er komen twintig bestellingen per pagina; filteren ná het ophalen zou
 *    "de eerste twintig, en daarvan wat past" geven — verkeerd zodra iemand meer bestellingen heeft;
 *  - **een gefilterde lijst is te delen en te bookmarken**, en de terugknop werkt;
 *  - **geen JavaScript nodig**: het is een gewoon `<form method="get">`.
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
}

/** De filterwaarden zoals ze uit de URL komen; alles is optioneel en mag onzin zijn. */
type Search = {
  page?: string
  from?: string
  to?: string
  min?: string
  max?: string
  sort?: string
}

/** Alleen de sorteringen die het CMS kent; al het andere wordt de standaard. */
const SORTS = ['newest', 'oldest', 'price_desc', 'price_asc'] as const
type Sort = (typeof SORTS)[number]

const asSort = (value: string | undefined): Sort =>
  (SORTS as readonly string[]).includes(String(value)) ? (value as Sort) : 'newest'

export default async function AccountOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Search>
}) {
  const { locale } = await params
  const search = await searchParams
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const ui = shop.ui

  const session = await getAccountSession()
  if (!session) redirect(`/${locale}${loginPath('/account/bestellingen')}`)

  const page = Math.max(1, Number(search.page ?? 1) || 1)
  const filters = {
    page,
    from: search.from?.trim() || undefined,
    to: search.to?.trim() || undefined,
    min: search.min?.trim() || undefined,
    max: search.max?.trim() || undefined,
    sort: asSort(search.sort),
  }

  const { orders, totalPages, total } = await getOrders(session.token, filters)

  /** Dezelfde filters meenemen naar een andere pagina; anders valt het filter weg bij "volgende". */
  const pageHref = (target: number): string => {
    const qs = new URLSearchParams()
    if (filters.from) qs.set('from', filters.from)
    if (filters.to) qs.set('to', filters.to)
    if (filters.min) qs.set('min', filters.min)
    if (filters.max) qs.set('max', filters.max)
    if (filters.sort !== 'newest') qs.set('sort', filters.sort)
    if (target > 1) qs.set('page', String(target))
    const query = qs.toString()
    return `/account/bestellingen${query ? `?${query}` : ''}`
  }

  const filtered = Boolean(filters.from || filters.to || filters.min || filters.max)

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={ui.myOrders} eyebrow="" text="" title={ui.myOrders} />
      <section className="section">
        <div className="container">
          <div className="account-layout">
            <AccountNav active="orders" email={session.customer.email} ui={ui} />

            <div className="account-main">
              <OrderFilters ui={ui} values={filters} />

              {/* Bij een filter zonder resultaat is "je hebt nog geen bestellingen" onwaar en verwarrend:
                  de bezoeker heeft ze wél, alleen niet in deze selectie. */}
              {orders.length === 0 && filtered ? (
                <p className="account-empty">{ui.noOrdersInFilter}</p>
              ) : (
                <OrderHistory locale={locale} orders={orders} ui={ui} />
              )}

              {filtered && orders.length > 0 && (
                <p className="account-note">
                  {ui.filterResultCount.replace('{n}', String(total))}
                </p>
              )}

              {totalPages > 1 && (
                <div className="shop-pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <LocaleLink
                      className={`shop-page${n === page ? ' shop-page--active' : ''}`}
                      href={pageHref(n)}
                      key={n}
                    >
                      {n}
                    </LocaleLink>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Shell>
  )
}
