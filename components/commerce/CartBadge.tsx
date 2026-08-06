'use client'
/**
 * Winkelwagen-icoon met aantal, voor de header.
 *
 * Rendert server-side GEEN getal: het aantal komt uit een fetch na hydratie (zie de toelichting in
 * CartProvider.tsx — de header staat op elke pagina en mag de statische weergave niet breken).
 *
 * De bubbel heeft een vaste afmeting en de link een vaste breedte, zodat er geen layout-verschuiving
 * is op het moment dat het getal verschijnt.
 */
import { LocaleLink } from '@/components/LocaleLink'

import { useCart } from './CartProvider'

export function CartBadge({ label }: { label: string }) {
  const { itemCount } = useCart()

  return (
    <LocaleLink aria-label={label} className="cart-badge" href="/winkelwagen">
      <svg
        aria-hidden="true"
        fill="none"
        height="20"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
        viewBox="0 0 24 24"
        width="20"
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      {/* Geen `0` tonen: een lege winkelwagen hoeft geen aandacht te trekken. */}
      {itemCount > 0 && (
        <span aria-hidden="true" className="cart-badge-count">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
      <span className="sr-only">
        {itemCount > 0 ? `${label} (${itemCount})` : label}
      </span>
    </LocaleLink>
  )
}
