import type { SiteContent } from '@/lib/types'

import { Icon } from './icons'
import { LocaleLink } from './LocaleLink'

/** Footer link: internal ("/...") routes localise via LocaleLink; external URLs open in a new tab.
 *  LocaleLink already renders external URLs as a plain <a>, but we add target/rel here. */
function FooterLink({ url, label }: { url: string; label: string }) {
  return url.startsWith('/') ? (
    <LocaleLink href={url}>{label}</LocaleLink>
  ) : (
    <a href={url} target="_blank" rel="noreferrer">{label}</a>
  )
}

export function Footer({ site }: { site: SiteContent }) {
  const f = site.footer
  // The footer has its OWN logo field so a light-on-dark variant can be uploaded for the dark
  // footer; when it's empty we reuse the header logo rather than dropping to the text brand name.
  const logo = f.logo || site.logo
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="footer-logo" src={logo} alt={site.brandName} />
            ) : (
              <div className="footer-brand-name">{site.brandName}</div>
            )}
            <p>{f.about}</p>
            <div className="footer-contact">
              <div><b>E-mail</b>{f.email}</div>
              <div><b>Telefoon</b>{f.phone}</div>
            </div>
            <div className="footer-socials">
              {f.socials.map((s) => (
                <a key={s.label} href={s.url} aria-label={s.label} target="_blank" rel="noreferrer">
                  <Icon name={s.icon} size={18} />
                </a>
              ))}
            </div>
          </div>

          {f.columns.map((col) => (
            <div key={col.heading}>
              <h4>{col.heading}</h4>
              <ul>
                {col.links.map((l) => (
                  <li key={l.label}><FooterLink url={l.url} label={l.label} /></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <span>{f.rightsText}</span>
          <FooterLink url={f.legalUrl} label={f.legalLabel} />
        </div>
      </div>
    </footer>
  )
}
