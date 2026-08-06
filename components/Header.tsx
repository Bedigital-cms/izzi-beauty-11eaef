import { switcherLocales } from '@/lib/i18n'
import type { NavItem as NavItemType, SiteContent } from '@/lib/types'

import { commerceEnabled } from '@/lib/commerce/config'

import { AccountLink } from './commerce/AccountLink'
import { CartBadge } from './commerce/CartBadge'
import { LanguageSwitcher } from './LanguageSwitcher'
import { LocaleLink } from './LocaleLink'
import { MobileMenu } from './MobileMenu'

/**
 * Header with a hover mega-menu. Top-level items with `columns` open a multi-column
 * dropdown (Behandelingen, Opleidingen); plain items are simple links. All internal
 * links use <LocaleLink> (locale-prefixed); the nav tree is driven by content/<locale>/site.json,
 * passed in as `site`. A LanguageSwitcher shows only when the site has >1 active locale.
 *
 * OVERFLOW ("priority+"): a header only fits so many top-level items before it crowds the logo/CTA.
 * So we show at most MAX_TOP_NAV slots; with more items the last slot becomes a "More" mega-menu that
 * holds every remaining item (with its sub-links) — the nav stays on one tidy row no matter how many
 * links the site has. The mobile drawer still lists everything.
 */

/**
 * Max top-level slots on the desktop nav (the last becomes "More" when there are more items).
 *
 * 9, niet 7: een webshop-site heeft twee slots meer nodig dan een brochure-site. Bij 7 viel het
 * achtste item in de "More"-mega — en op IZZI was dat "Webshop", precies de pagina waar de hele
 * commerce-module voor bestaat. Bij 8 verhuisden Webshop ÉN Contact erin (de overflow pakt
 * `slice(MAX - 1)`, dus de laatste zichtbare slot gaat óók de bucket in zodra er overflow is).
 *
 * De rij past: de CTA, taalkiezer en winkelwagen staan in hun eigen flex-gebied rechts
 * (`.header-cta`), dus die verdringen deze slots niet. Komt er een tiende item bij, dan verschijnt
 * "More" weer — en dan hoort dit getal opnieuw tegen het ontwerp aangehouden te worden in plaats van
 * stilzwijgend verhoogd: negen is ongeveer wat een header op 1280px comfortabel draagt.
 */
const MAX_TOP_NAV = 9

/** Label for the overflow "More" item, per language (the nav content has no entry for it). */
const MORE_LABEL: Record<string, string> = {
  nl: 'Meer', en: 'More', de: 'Mehr', fr: 'Plus', es: 'Más', it: 'Altro', pt: 'Mais', pl: 'Więcej',
  da: 'Mere', sv: 'Mer', no: 'Mer', fi: 'Lisää', cs: 'Více', hu: 'Több', ro: 'Mai mult', el: 'Περισσότερα',
  tr: 'Daha fazla', ru: 'Ещё', uk: 'Ще', ar: 'المزيد', he: 'עוד', hi: 'और', bn: 'আরও',
  'zh-CN': '更多', 'zh-TW': '更多', ja: 'もっと見る', ko: '더 보기',
}

/** All sub-links of a nav item, flattened across its columns (safe when a column omits `links`). */
const sublinksOf = (item: NavItemType) => (item.columns ?? []).flatMap((c) => c.links ?? [])

/** One top-level nav item: a plain link, or a link + hover mega for items with columns. */
function NavItem({ item }: { item: NavItemType }) {
  const cols = item.columns ?? []
  const hasMega = cols.length > 0
  return (
    <div className="navitem">
      <LocaleLink href={item.url}>
        {item.label}
        {hasMega && <span className="caret" aria-hidden="true" />}
      </LocaleLink>
      {hasMega && (
        <div className={`mega${cols.length === 1 ? ' mega-1col' : ''}`}>
          {cols.map((col) => (
            <div className="mega-col" key={col.heading}>
              <h4>{col.heading}</h4>
              {(col.links ?? []).map((l) => (
                <LocaleLink key={l.label} href={l.url}>
                  {l.label}
                  {l.tag && <span className="tag">{l.tag}</span>}
                </LocaleLink>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Header({
  site,
  locale = 'nl',
  cartLabel = 'Winkelwagen',
  accountLabel = 'Mijn account',
}: {
  site: SiteContent
  locale?: string
  /** Label voor het winkelwagen-icoon; komt uit content/shop.json zodat het vertaalbaar is. */
  cartLabel?: string
  /** Label voor het account-icoon; ook uit content/shop.json. */
  accountLabel?: string
}) {
  const nav = site.nav ?? []
  // On-row items + an overflow bucket. When it all fits (≤ MAX), show everything as-is.
  const overflowing = nav.length > MAX_TOP_NAV
  const visible = overflowing ? nav.slice(0, MAX_TOP_NAV - 1) : nav
  const overflow = overflowing ? nav.slice(MAX_TOP_NAV - 1) : []
  const moreLabel = MORE_LABEL[locale] || MORE_LABEL[locale.split('-')[0]] || 'More'

  return (
    <header className="header">
      <div className="container header-inner">
        <LocaleLink className="brand" href="/" aria-label={site.brandName}>
          {site.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="brand-logo" src={site.logo} alt={site.brandName} />
          ) : (
            <span className="brand-name">{site.brandName}</span>
          )}
        </LocaleLink>

        <nav className="mainnav" aria-label="Hoofdmenu">
          {visible.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}

          {overflow.length > 0 && (
            <div className="navitem navitem-more">
              {/* Hover/focus trigger (not a link) for the overflow mega. Its items live in the DOM
                  below, so they stay crawlable. */}
              <button type="button" className="nav-more" aria-haspopup="true">
                {moreLabel}
                <span className="caret" aria-hidden="true" />
              </button>
              <div className="mega mega-more">
                {/* Match the normal mega structure: an overflow item that HAS real sub-links becomes a
                    titled column (heading + nested link list, exactly like Behandelingen/Opleidingen).
                    Everything else — plain links AND items whose columns carry no links — is grouped
                    into one clean column of plain links (no lonely gold heading). */}
                {overflow
                  .filter((item) => sublinksOf(item).length > 0)
                  .map((item) => (
                    <div className="mega-col" key={item.label}>
                      <h4><LocaleLink href={item.url}>{item.label}</LocaleLink></h4>
                      {sublinksOf(item).map((l) => (
                        <LocaleLink key={l.label} href={l.url}>
                          {l.label}
                          {l.tag && <span className="tag">{l.tag}</span>}
                        </LocaleLink>
                      ))}
                    </div>
                  ))}
                {overflow.some((item) => sublinksOf(item).length === 0) && (
                  <div className="mega-col mega-col-plain">
                    {overflow
                      .filter((item) => sublinksOf(item).length === 0)
                      .map((item) => (
                        <LocaleLink key={item.label} href={item.url}>{item.label}</LocaleLink>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </nav>

        <div className="header-cta">
          {/* switcherLocales() is empty in per-domain mode → the switcher hides itself. */}
          <LanguageSwitcher locales={switcherLocales()} />
          {/* Winkelwagen alleen bij een tenant met webshop. Dit is een client-island dat zijn aantal
              ná hydratie ophaalt — zou de header de cookie server-side lezen, dan werd de HELE site
              dynamisch en verliest hij zijn statische weergave. Zie CartProvider.tsx. */}
          {commerceEnabled() && <AccountLink label={accountLabel} />}
          {commerceEnabled() && <CartBadge label={cartLabel} />}
          <LocaleLink className="btn btn-gold" href={site.ctaUrl}>{site.ctaLabel}</LocaleLink>
        </div>

        <MobileMenu
          nav={site.nav}
          ctaLabel={site.ctaLabel}
          ctaUrl={site.ctaUrl}
          locales={switcherLocales()}
          /* De header-CTA's (account, winkelwagen) staan onder 1240px niet in de rij maar in de
             lade — zonder dit is het account op een telefoon onbereikbaar. */
          accountLabel={commerceEnabled() ? accountLabel : undefined}
          cartLabel={commerceEnabled() ? cartLabel : undefined}
        />
      </div>
    </header>
  )
}
