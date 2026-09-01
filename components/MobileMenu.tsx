'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import type { NavItem } from '@/lib/types'

import { LanguageSwitcher } from './LanguageSwitcher'
import { LocaleLink } from './LocaleLink'
import { externalLinkProps } from '@/lib/href'

/**
 * Mobile navigation: a hamburger button that opens a full-height drawer with the nav tree.
 * Top-level items that have mega-menu columns are ACCORDIONS (tap to expand/collapse; all collapsed
 * by default, one open at a time) so a big menu isn't one endless scroll. Plain items are simple
 * links. Client component; driven by the same site.json nav data.
 *
 * PORTAL: the overlay + drawer are rendered into <body>, NOT inline here. This component sits inside
 * <header>, and `.header` uses `backdrop-filter`, which makes the header a containing block for
 * fixed-position descendants — so an inline `position: fixed; inset: 0` drawer would size and clip
 * against the header box instead of the viewport (short drawer, overlay that never covers the page)
 * and stay trapped in the header's z-index: 100 stacking context. Portalling to <body> escapes both.
 */
export function MobileMenu({
  nav,
  ctaLabel,
  ctaUrl,
  locales,
  accountLabel,
  cartLabel,
}: {
  nav: NavItem[]
  ctaLabel: string
  ctaUrl: string
  locales?: string[]
  /** Alleen bij een tenant met webshop: link naar het klantaccount. */
  accountLabel?: string
  /** Alleen bij een tenant met webshop: link naar de winkelwagen. */
  cartLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null) // label of the currently-open accordion
  const close = () => { setOpen(false); setExpanded(null) }
  // Portals need a DOM node, so only render them after mount (SSR has no document).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Close on route change. The links' own onClick covers taps, but not the browser back/forward
  // buttons — without this, going Back with the drawer open leaves it open over the previous page
  // (and the body scroll lock still applied).
  const pathname = usePathname()
  useEffect(() => { setOpen(false); setExpanded(null) }, [pathname])

  // Lock background scroll while the drawer is open.
  //
  // `overflow: hidden` on <body> alone is not enough on iOS Safari, which happily scrolls the page
  // behind a fixed overlay. The reliable cross-browser lock is `position: fixed` + a negative `top`
  // that preserves the current offset, restored on close — otherwise closing the drawer dumps the
  // user back at the top of the page. `width: 100%` keeps the now-out-of-flow body from collapsing,
  // and padding-right compensates for the scrollbar that disappears on desktop (no content shift).
  useEffect(() => {
    if (!open) return
    const y = window.scrollY
    const { body } = document
    const gap = window.innerWidth - document.documentElement.clientWidth
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width, paddingRight: body.style.paddingRight }
    body.style.position = 'fixed'
    body.style.top = `-${y}px`
    body.style.width = '100%'
    if (gap > 0) body.style.paddingRight = `${gap}px`
    return () => {
      Object.assign(body.style, prev)
      // `scrollBehavior: smooth` on <html> would animate this restore — jarring. Jump instantly.
      window.scrollTo({ top: y, behavior: 'instant' })
    }
  }, [open])

  // Escape closes the drawer — expected of any modal-ish overlay, and the only keyboard way out.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // A resize up into the desktop breakpoint should not leave an orphaned drawer open behind the
  // restored nav (the drawer's own media query hides the hamburger, not the panel).
  useEffect(() => {
    if (!open) return
    const mq = window.matchMedia('(min-width: 1241px)')
    const onChange = () => { if (mq.matches) close() }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [open])

  const surfaces = (
    <>
      {open && <div className="drawer-overlay" onClick={close} />}

      {/* `inert` (React 19) takes the closed drawer's links out of the tab order and out of the
          accessibility tree — aria-hidden alone left them focusable. */}
      <aside className={`drawer${open ? ' is-open' : ''}`} aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <span className="drawer-title">Menu</span>
          <button className="drawer-close" aria-label="Sluiten" onClick={close}>&times;</button>
        </div>
        <nav className="drawer-nav">
          {nav.map((item) => {
            const hasColumns = !!item.columns && item.columns.length > 0
            // Plain item (no sub-menu) → simple link.
            if (!hasColumns) {
              return (
                <div className="drawer-group" key={item.label}>
                  <LocaleLink className="drawer-link" href={item.url} onClick={close} {...externalLinkProps(item.url, item.target)}>{item.label}</LocaleLink>
                </div>
              )
            }
            // Item with columns → accordion toggle.
            const isOpen = expanded === item.label
            return (
              <div className={`drawer-group${isOpen ? ' is-open' : ''}`} key={item.label}>
                <button
                  type="button"
                  className="drawer-acc"
                  aria-expanded={isOpen}
                  onClick={() => setExpanded(isOpen ? null : item.label)}
                >
                  <span>{item.label}</span>
                  <span className="drawer-acc-caret" aria-hidden="true" />
                </button>
                {isOpen && (
                  <div className="drawer-acc-body">
                    {/* Direct link to the section's own overview page. */}
                    <LocaleLink className="drawer-sublink drawer-sublink--all" href={item.url} onClick={close}>
                      Alle {item.label.toLowerCase()}
                    </LocaleLink>
                    {item.columns!.map((col) => (
                      <div className="drawer-sub" key={col.heading}>
                        <span className="drawer-sub-head">{col.heading}</span>
                        {col.links.map((l) => (
                          <LocaleLink key={l.label} className="drawer-sublink" href={l.url} onClick={close} {...externalLinkProps(l.url, l.target)}>{l.label}</LocaleLink>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        {/* Webshop-links. Op desktop staan deze als icoon in `.header-cta`; die rij is onder 1240px
            verborgen, dus hier horen ze als gewone links in de lade. */}
        {(accountLabel || cartLabel) && (
          <div className="drawer-shop">
            {accountLabel && (
              <LocaleLink className="drawer-link" href="/account" onClick={close}>
                {accountLabel}
              </LocaleLink>
            )}
            {cartLabel && (
              <LocaleLink className="drawer-link" href="/winkelwagen" onClick={close}>
                {cartLabel}
              </LocaleLink>
            )}
          </div>
        )}
        {locales && locales.length > 1 && (
          <div className="drawer-lang">
            <span className="drawer-sub-head">Taal / Language</span>
            <LanguageSwitcher locales={locales} variant="mobile" />
          </div>
        )}
        <LocaleLink className="btn btn-gold drawer-cta" href={ctaUrl} onClick={close}>{ctaLabel}</LocaleLink>
      </aside>
    </>
  )

  return (
    <div className="mobilenav">
      <button
        className="hamburger"
        aria-label={open ? 'Menu sluiten' : 'Menu openen'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span /><span /><span />
      </button>

      {/* Before hydration there is no portal target, so the drawer renders inline (closed and inert —
          harmless). After mount it moves to <body>, out of the header's containing block. */}
      {mounted ? createPortal(surfaces, document.body) : surfaces}
    </div>
  )
}
