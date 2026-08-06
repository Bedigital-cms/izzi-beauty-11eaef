/**
 * Account-icoon in de header.
 *
 * ── Waarom dit géén client-island is (in tegenstelling tot de winkelwagen-badge) ───────────────
 * Het icoon wijst altijd naar `/account`, of de bezoeker ingelogd is of niet — die pagina beslist zelf
 * of ze het overzicht of het inlogformulier laat zien. Er is dus niets om na hydratie op te halen, en
 * dus ook geen reden om de sessiecookie server-side te lezen. Dat laatste is belangrijk: `cookies()` in
 * de header zou élke pagina van deze site dynamisch maken en de statische weergave van ~90
 * contentpagina's opgeven — voor een icoon dat er hetzelfde uitziet. Zie CartProvider.tsx voor
 * dezelfde afweging bij de winkelwagen.
 */
import { LocaleLink } from '@/components/LocaleLink'

export function AccountLink({ label }: { label: string }) {
  return (
    <LocaleLink aria-label={label} className="account-link" href="/account">
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
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span className="sr-only">{label}</span>
    </LocaleLink>
  )
}
