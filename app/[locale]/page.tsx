import Form, { type FormDef } from '@/components/Form'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { Icon } from '@/components/icons'
import { LocaleLink, LocaleProvider } from '@/components/LocaleLink'
import { Media } from '@/components/Media'
import { CardGrid, CtaBand, LocationCards, ReviewMarquee } from '@/components/sections'
import { CommerceBoundary } from '@/components/commerce/CommerceBoundary'
import { getHome } from '@/content/home'
import { loadForm } from '@/content/load'
import { getShopUI } from '@/content/shop'
import { getSite } from '@/content/site'
import { defaultLocale, hideDefaultPrefix } from '@/lib/i18n'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const home = getHome(locale)
  const site = getSite(locale)
  // Localized contact-form definition (translated labels/placeholders/button for this language).
  const contactForm = loadForm<FormDef>('contact', locale)
  const { hero, reviewStrip, intro, treatments, trainings, usps, stats, reviewsSection, locationsSection, contactSection, cta } = home
  return (
    <LocaleProvider locale={locale} defaultLocale={defaultLocale()} hideDefaultPrefix={hideDefaultPrefix()}>
      {/* Deze pagina stelt Header/Footer zelf samen (eigen hero-opmaak) en heeft daarom ook zelf de
          CommerceBoundary nodig — anders werkt de winkelwagen-badge overal behalve op de homepage. */}
      <CommerceBoundary>
      <Header
        site={site}
        locale={locale}
        accountLabel={getShopUI(locale).myAccount}
        cartLabel={getShopUI(locale).cartTitle}
      />

      {/* Hero — dark, image- or video-backed, editorial */}
      <section className="hero">
        <div className="hero-bg">
          {hero.videoUrl ? (
            <video src={hero.videoUrl} autoPlay muted loop playsInline poster={hero.image || undefined} />
          ) : hero.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.image} alt="" />
          ) : null}
        </div>
        <div className="container">
          <div className="hero-inner">
            <span className="eyebrow">{hero.eyebrow}</span>
            <h1>{hero.titleLead} <em>{hero.titleEm}</em> {hero.titleTail}</h1>
            <p>{hero.text}</p>
            <div className="hero-actions">
              <LocaleLink className="btn btn-gold" href={hero.primaryUrl}>{hero.primaryLabel}</LocaleLink>
              <LocaleLink className="btn btn-light" href={hero.secondaryUrl}>{hero.secondaryLabel}</LocaleLink>
            </div>
            <div className="hero-meta">
              {hero.meta.map((m) => (
                <div key={m.lbl}>
                  <div className="num">{m.num}</div>
                  <div className="lbl">{m.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Review strip */}
      <div className="reviewstrip">
        <div className="container">
          <span className="stars">★★★★★</span>
          <span>{reviewStrip.text}</span>
          <LocaleLink href={reviewStrip.linkUrl}>{reviewStrip.linkLabel}</LocaleLink>
        </div>
      </div>

      {/* Intro — split with badge */}
      <section className="section">
        <div className="container">
          <div className="split">
            <div className="split-media">
              <Media src={intro.image} alt={intro.title} shape="portrait" label={intro.title} />
              <div className="badge">
                <div className="num">{intro.badgeNum}</div>
                <div className="lbl">{intro.badgeLabel}</div>
              </div>
            </div>
            <div className="split-body">
              <span className="eyebrow">{intro.eyebrow}</span>
              <h2>{intro.title}</h2>
              <p>{intro.text}</p>
              <ul className="checklist">
                {intro.checklist.map((c) => (
                  <li key={c}><span className="tick"><Icon name="check" size={13} /></span>{c}</li>
                ))}
              </ul>
              <LocaleLink className="btn btn-ghost" href={intro.buttonUrl}>{intro.buttonLabel}</LocaleLink>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments */}
      <section className="section" style={{ background: 'var(--champagne)' }}>
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow center">{treatments.eyebrow}</span>
            <h2>{treatments.title}</h2>
            <p>{treatments.text}</p>
          </div>
          <CardGrid items={treatments.items} />
          <div style={{ textAlign: 'center', marginTop: 46 }}>
            <LocaleLink className="btn btn-ghost" href={treatments.buttonUrl}>{treatments.buttonLabel}</LocaleLink>
          </div>
        </div>
      </section>

      {/* USPs */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow center">{usps.eyebrow}</span>
            <h2>{usps.title}</h2>
            <p>{usps.text}</p>
          </div>
          <div className="grid-4">
            {usps.items.map((u) => (
              <div className="feature" key={u.title}>
                <div className="feature-icon"><Icon name={u.icon} size={24} /></div>
                <h3>{u.title}</h3>
                <p>{u.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="section-sm stats">
        <div className="container">
          <div className="grid-4">
            {stats.map((s) => (
              <div className="stat" key={s.lbl}>
                <div className="num">{s.num}</div>
                <div className="lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainings / academy */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow center">{trainings.eyebrow}</span>
            <h2>{trainings.title}</h2>
            <p>{trainings.text}</p>
          </div>
          <CardGrid items={trainings.items} />
          <div style={{ textAlign: 'center', marginTop: 46 }}>
            <LocaleLink className="btn btn-ghost" href={trainings.buttonUrl}>{trainings.buttonLabel}</LocaleLink>
          </div>
        </div>
      </section>

      {/* Reviews — continuous right-to-left marquee with fade edges */}
      <section className="section reviews">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow center">{reviewsSection.eyebrow}</span>
            <h2>{reviewsSection.title}</h2>
          </div>
        </div>
        <ReviewMarquee items={reviewsSection.items} />
      </section>

      {/* Locations */}
      <section className="section">
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow center">{locationsSection.eyebrow}</span>
            <h2>{locationsSection.title}</h2>
            <p>{locationsSection.text}</p>
          </div>
          <LocationCards items={site.footer.locations} />
        </div>
      </section>

      {/* CTA */}
      <CtaBand cta={cta} />
      {/* Contact — left: contact info (from site.json), right: the form (content/forms.json).
          Editable/movable via the Forms editor + AI Website. */}
      <section className="section contact-section" id="contact">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-info">
              <span className="eyebrow">{contactSection.eyebrow}</span>
              <h2>{contactSection.title}</h2>
              <p>{contactSection.text}</p>
              <ul className="contact-list">
                {contactSection.email && (
                  <li><span className="contact-list-label">E-mail</span><a href={`mailto:${contactSection.email}`}>{contactSection.email}</a></li>
                )}
                {contactSection.phone && (
                  <li><span className="contact-list-label">Telefoon</span><a href={`tel:${String(contactSection.phone).replace(/\s/g, '')}`}>{contactSection.phone}</a></li>
                )}
                {(contactSection.locations ?? []).map((loc) => (
                  <li key={loc.name}>
                    <span className="contact-list-label">{loc.name}</span>
                    <span>{loc.address}{loc.hours ? ` · ${loc.hours}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="contact-form">
              <Form slug="contact" def={contactForm} />
            </div>
          </div>
        </div>
      </section>

      <Footer site={site} />
      </CommerceBoundary>
    </LocaleProvider>
  )
}
