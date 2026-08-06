'use client'
/**
 * Betaalstatus op de bedankpagina, met polling.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WAAROM POLLEN EN NIET AANNEMEN DAT HET GELUKT IS
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Mollie stuurt de klant terug naar deze pagina zodra hij bij de bank klaar is — mogelijk VÓÓRDAT de
 * webhook bij het CMS is aangekomen. De bezoeker staat hier dus geregeld terwijl de bestelling nog op
 * "wacht op betaling" staat. Concluderen "betaald, want de klant is hier" is fout: dan zou een
 * afgebroken of mislukte betaling ook als geslaagd worden getoond.
 *
 * Mollie waarschuwt hier zelf expliciet voor. Dus: status opvragen, en blijven kijken zolang de
 * uitkomst nog niet vaststaat.
 *
 * Aflopende interval (1s → 5s) met een harde bovengrens: een betaling die na een halve minuut nog
 * niet binnen is, wordt vrijwel altijd door de reconciliatietaak van het CMS opgepakt. Eindeloos
 * doorvragen belast alleen de server.
 */
import * as React from 'react'

import { LocaleLink } from '@/components/LocaleLink'
import type { OrderStatusResponse } from '@/lib/commerce/types'
import type { ShopUIStrings } from '@/lib/types'

import { useCart } from './CartProvider'

type Phase = 'checking' | 'paid' | 'pending' | 'failed'

const MAX_ATTEMPTS = 12

export function PaymentStatus({
  orderNumber,
  token,
  ui,
}: {
  orderNumber: string
  token: string
  ui: ShopUIStrings
}) {
  const [phase, setPhase] = React.useState<Phase>('checking')
  const [attempts, setAttempts] = React.useState(0)
  const { clear } = useCart()

  /*
   * Winkelwagen legen zodra de betaling vaststaat.
   *
   * Het CMS zet de wagen bij een geslaagde betaling op `converted`, maar het token blijft in de cookie
   * van deze site staan. Zonder deze regel bleef de badge in de header het aantal van de net BETAALDE
   * bestelling tonen en stonden de gekochte artikelen nog in /winkelwagen — een bug die precies op het
   * moment van succes zichtbaar is.
   *
   * Bewust NIET bij een mislukte of nog lopende betaling: dan moet de bezoeker het opnieuw kunnen
   * proberen, en dat kan alleen met zijn winkelwagen nog intact.
   */
  React.useEffect(() => {
    if (phase === 'paid') void clear()
  }, [phase, clear])

  React.useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function check(attempt: number) {
      try {
        const res = await fetch(
          `/api/commerce/order-status?order=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(token)}`,
          { credentials: 'same-origin' },
        )
        const body = (await res.json().catch(() => null)) as
          | { ok?: boolean; data?: OrderStatusResponse }
          | null

        if (cancelled) return

        const status = body?.data
        if (!status) {
          setPhase('failed')
          return
        }

        // `delivered` hoort hier ook bij: het is een status ná betaald. Ontbreekt hij, dan blijft deze
        // pagina pollen op een betaling die al gelukt is en eindigt de klant op "we verwerken je
        // betaling" terwijl zijn pakket al onderweg is.
        if (
          status.status === 'paid' ||
          status.status === 'processing' ||
          status.status === 'fulfilled' ||
          status.status === 'delivered'
        ) {
          setPhase('paid')
          return
        }
        if (status.status === 'cancelled' || status.status === 'expired') {
          setPhase('failed')
          return
        }

        // Nog onderweg. Opnieuw kijken, met een langer wordend interval.
        if (attempt >= MAX_ATTEMPTS) {
          setPhase('pending')
          return
        }
        setAttempts(attempt + 1)
        const delay = Math.min(1000 + attempt * 500, 5000)
        timer = setTimeout(() => void check(attempt + 1), delay)
      } catch {
        if (!cancelled) setPhase('pending')
      }
    }

    void check(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [orderNumber, token])

  if (phase === 'checking') {
    return (
      <div className="payment-status payment-status--pending" role="status">
        <p className="payment-status-title">{ui.paymentPending}</p>
        <p>{ui.paymentPendingText}</p>
        <span className="payment-spinner" aria-hidden="true" />
      </div>
    )
  }

  if (phase === 'paid') {
    return (
      <div className="payment-status payment-status--success" role="status">
        <p className="payment-status-title">{ui.thankYouTitle}</p>
        <p>{ui.thankYouText}</p>
        <p className="payment-status-order">
          {ui.orderNumber}: <strong>{orderNumber}</strong>
        </p>
        <LocaleLink className="btn btn-gold" href={`/order/${orderNumber}?token=${encodeURIComponent(token)}`}>
          {ui.viewOrder}
        </LocaleLink>
      </div>
    )
  }

  if (phase === 'failed') {
    return (
      <div className="payment-status payment-status--failed" role="alert">
        <p className="payment-status-title">{ui.paymentFailed}</p>
        <p>{ui.paymentFailedText}</p>
        <LocaleLink className="btn btn-gold" href="/winkelwagen">
          {ui.viewCart}
        </LocaleLink>
      </div>
    )
  }

  // Nog steeds in behandeling na de maximale pogingen: de reconciliatietaak pakt dit op, en de klant
  // krijgt zijn bevestiging per e-mail.
  return (
    <div className="payment-status payment-status--pending" role="status">
      <p className="payment-status-title">{ui.paymentPending}</p>
      <p>
        {ui.paymentPendingText} {ui.orderNumber}: <strong>{orderNumber}</strong>
      </p>
      <LocaleLink className="link-arrow" href={`/order/${orderNumber}?token=${encodeURIComponent(token)}`}>
        {ui.viewOrder}
      </LocaleLink>
      {attempts >= MAX_ATTEMPTS && (
        <p className="payment-status-note">
          Je ontvangt een e-mail zodra de betaling is verwerkt.
        </p>
      )}
    </div>
  )
}
