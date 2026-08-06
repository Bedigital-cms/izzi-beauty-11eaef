'use client'
/**
 * Uitloggen.
 *
 * Een POST en geen link: uitloggen is een MUTATIE (de sessiecookie wordt gewist). Met een GET-link
 * kan een `<img src="/api/…?action=logout">` op een andere site een bezoeker uitloggen, en zou een
 * prefetch van de browser hem er stilletjes uit gooien. De route controleert bovendien de Origin.
 *
 * Daarna een harde navigatie naar de homepage: alles wat server-side gerenderd is (accountpagina's,
 * afrekenformulier) moet opnieuw, nu zonder sessie.
 */
import * as React from 'react'

import { useLocaleConfig } from '@/components/LocaleLink'
import { localeHref } from '@/lib/href'

export function LogoutButton({ label, className = 'btn btn-outline' }: { label: string; className?: string }) {
  const { locale, defaultLocale, hideDefaultPrefix } = useLocaleConfig()
  const [busy, setBusy] = React.useState(false)

  async function logout() {
    setBusy(true)
    try {
      await fetch('/api/commerce/auth?action=logout', {
        method: 'POST',
        credentials: 'same-origin',
      })
    } catch {
      // Ook bij een netwerkfout doorsturen: de bezoeker heeft op uitloggen geklikt en hoort niet op
      // een accountpagina te blijven staan. Bij de volgende poging wordt de cookie alsnog gewist.
    }
    window.location.assign(localeHref(locale, '/', { defaultLocale, hideDefaultPrefix }))
  }

  return (
    <button className={className} disabled={busy} onClick={() => void logout()} type="button">
      {label}
    </button>
  )
}
