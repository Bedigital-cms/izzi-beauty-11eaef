/**
 * Zijmenu van het klantaccount, met daaronder de uitlogknop.
 *
 * Server-component: welke pagina actief is geeft de pagina zelf mee (`active`) in plaats van dat dit
 * component de URL uitleest. Dat scheelt een client-island op elke accountpagina — en de pagina weet
 * per definitie beter welke van de vier hij is dan een pad-vergelijking die bij een taalprefix of een
 * afsluitende slash net misgaat.
 */
import { LocaleLink } from '@/components/LocaleLink'
import type { ShopUIStrings } from '@/lib/types'

import { LogoutButton } from './LogoutButton'

export type AccountSection = 'overview' | 'orders' | 'addresses' | 'details'

export function AccountNav({ active, ui, email }: { active: AccountSection; ui: ShopUIStrings; email: string }) {
  const items: Array<{ key: AccountSection; href: string; label: string }> = [
    { key: 'overview', href: '/account', label: ui.accountOverview },
    { key: 'orders', href: '/account/bestellingen', label: ui.myOrders },
    { key: 'addresses', href: '/account/adressen', label: ui.accountAddresses },
    { key: 'details', href: '/account/gegevens', label: ui.accountDetails },
  ]

  return (
    <aside className="account-nav">
      <p className="account-nav-user">
        <span>{ui.loggedInAs}</span>
        <strong>{email}</strong>
      </p>
      <nav aria-label={ui.myAccount}>
        <ul>
          {items.map((item) => (
            <li key={item.key}>
              <LocaleLink
                aria-current={active === item.key ? 'page' : undefined}
                className={`account-nav-link${active === item.key ? ' account-nav-link--active' : ''}`}
                href={item.href}
              >
                {item.label}
              </LocaleLink>
            </li>
          ))}
        </ul>
      </nav>
      <LogoutButton className="btn btn-outline account-logout" label={ui.logout} />
    </aside>
  )
}
