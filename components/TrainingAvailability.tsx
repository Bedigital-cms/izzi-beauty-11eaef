'use client'

/**
 * Beschikbare opleidingsdata uit het CMS-product (varianten).
 *
 * Client-island: de opleidingspagina zelf blijft statisch. Prijzen/datums/plekken komen NOOIT uit
 * git. Webshop uit of geen varianten → nette lege staat, nooit een 404-knop.
 */
import { useEffect, useState } from 'react'

import { formatMoney } from '@/lib/commerce/format'
import { commerceEnabled } from '@/lib/commerce/config'

import { LocaleLink } from './LocaleLink'

export type AvailabilityCopy = {
  title?: string
  text?: string
  emptyText?: string
  disabledText?: string
}

export type AvailabilityLabels = {
  seats: string
  seatsOne: string
  enrolDate: string
  requestInfo: string
  loading: string
}

type PublicVariant = {
  id: string | number
  title: string
  priceCents: number
  available: number
  inStock: boolean
  options: Array<{ name: string; value: string }>
}

type PublicProduct = {
  title: string
  slug: string
  priceCents: number | null
  currency: string
  variants: PublicVariant[]
}

export function TrainingAvailability({
  handle,
  copy,
  labels,
}: {
  handle?: string
  copy: AvailabilityCopy
  labels: AvailabilityLabels
}) {
  const enabled = commerceEnabled() && !!handle
  const [product, setProduct] = useState<PublicProduct | null>(null)
  const [loaded, setLoaded] = useState(!enabled)

  useEffect(() => {
    if (!enabled || !handle) return
    let cancelled = false
    fetch(`/api/commerce/product?handle=${encodeURIComponent(handle)}`)
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return
        if (body?.ok && body.product) setProduct(body.product as PublicProduct)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [enabled, handle])

  const variants = product?.variants ?? []
  const currency = product?.currency || 'EUR'

  return (
    <div className="training-dates" id="beschikbare-data">
      {copy.title && <h2>{copy.title}</h2>}
      {copy.text && <p>{copy.text}</p>}

      {!loaded && <p className="training-dates-note">{labels.loading}</p>}

      {loaded && !enabled && (
        <div className="training-dates-empty">
          <p>{copy.disabledText}</p>
          <a className="btn btn-gold" href="#opleiding-interesse">{labels.requestInfo}</a>
        </div>
      )}

      {loaded && enabled && variants.length === 0 && (
        <div className="training-dates-empty">
          <p>{copy.emptyText}</p>
          <a className="btn btn-gold" href="#opleiding-interesse">{labels.requestInfo}</a>
        </div>
      )}

      {loaded && variants.length > 0 && (
        <ul className="training-date-list">
          {variants.map((v) => {
            const seats = Math.max(0, v.available)
            const seatLabel = seats === 1 ? labels.seatsOne : labels.seats
            const optionLine = v.options.map((o) => o.value).filter(Boolean).join(' · ')
            return (
              <li className="training-date-card" key={String(v.id)}>
                <div>
                  <strong>{v.title}</strong>
                  {optionLine && optionLine !== v.title && <span>{optionLine}</span>}
                  <span className="training-date-meta">
                    {formatMoney(v.priceCents, currency)}
                    {' · '}
                    {v.inStock ? `${seats} ${seatLabel}` : `0 ${labels.seats}`}
                  </span>
                </div>
                {v.inStock && handle ? (
                  <LocaleLink className="btn btn-gold" href={`/product/${handle}`}>
                    {labels.enrolDate}
                  </LocaleLink>
                ) : (
                  <span className="training-date-full">{labels.requestInfo}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
