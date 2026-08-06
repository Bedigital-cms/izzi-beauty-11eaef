import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { CartView } from '@/components/commerce/CartView'
import { PageHero } from '@/components/sections'
import { Shell } from '@/components/Shell'
import { getShop } from '@/content/shop'
import { getCart } from '@/lib/commerce/client'
import { commerceEnabled } from '@/lib/commerce/config'
import { readCartToken } from '@/lib/commerce/session'

/**
 * /winkelwagen — de winkelwagen.
 *
 * Altijd dynamisch: leest de winkelwagen-cookie en haalt live prijzen op. Nooit cachen — een
 * gecachete winkelwagen zou de bezoeker de inhoud van iemand anders kunnen tonen.
 */
export const dynamic = 'force-dynamic'

// Niet indexeren: een winkelwagen is persoonlijk en heeft geen zoekwaarde.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!commerceEnabled()) notFound()

  const shop = getShop(locale)
  const token = await readCartToken()

  // Server-side de winkelwagen meegeven, zodat de eerste weergave meteen klopt. De client-provider
  // neemt het daarna over voor de interactie.
  const result = token ? await getCart(token) : null
  const cart = result?.ok ? result.data.cart : null

  return (
    <Shell locale={locale}>
      <PageHero breadcrumb={shop.ui.cartTitle} eyebrow="" text="" title={shop.ui.cartTitle} />
      <section className="section">
        <div className="container">
          <CartView initialCart={cart} ui={shop.ui} />
        </div>
      </section>
    </Shell>
  )
}
