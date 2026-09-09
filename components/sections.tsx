import type {
  CtaBlock,
  DetailContent,
  Faq,
  HubContent,
  InfoContent,
  LegalContent,
  LinkCard,
  Location,
  LocationPageContent,
  PriceGroup,
  Review,
  Step,
} from '@/lib/types'

import { getCategoryLinks } from '@/content/blog'
import { commerceEnabled } from '@/lib/commerce/config'

import { Icon } from './icons'
import { LocaleLink } from './LocaleLink'
import { Media } from './Media'
import { VideoEmbed } from './VideoEmbed'

/** Star row (filled ★ up to `n`). */
export function Stars({ n = 5 }: { n?: number }) {
  return <div className="stars" aria-label={`${n} van 5 sterren`}>{'★★★★★'.slice(0, n)}</div>
}

/** Internal-vs-external link that always renders a small "read more" arrow link. */
export function ArrowLink({ url, label = 'Lees meer' }: { url: string; label?: string }) {
  const inner = (
    <>
      {label}
      <Icon name="arrow" size={16} />
    </>
  )
  return url.startsWith('/') ? (
    <LocaleLink className="link-arrow" href={url}>{inner}</LocaleLink>
  ) : (
    <a className="link-arrow" href={url}>{inner}</a>
  )
}

/** Grid of image cards that link to a treatment / training / product page. */
export function CardGrid({ items }: { items: LinkCard[] }) {
  return (
    <div className="grid-3">
      {/*
        Sleutel op `url` en niet op `title`: een titel is inhoud en mag best twee keer voorkomen
        (twee vestigingen met dezelfde naam, twee behandelingen die hetzelfde heten), terwijl de
        URL per kaart uniek is — het is immers de pagina waar hij heen wijst. De index erbij houdt
        het ook heel als een lijst ooit twee keer naar dezelfde pagina verwijst.
      */}
      {items.map((c, i) => (
        <article className="card" key={`${c.url}-${i}`}>
          <div className="card-media">
            <Media src={c.image} alt={c.title} shape="free" label={c.title} />
          </div>
          <div className="card-body">
            <h3>{c.title}</h3>
            {c.meta && <div className="card-meta"><span>{c.meta}</span></div>}
            <p>{c.text}</p>
            <ArrowLink url={c.url} label={c.linkLabel || 'Meer info'} />
          </div>
        </article>
      ))}
    </div>
  )
}

/** Single review card (shared by the grid + the marquee). */
function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="review-card">
      <Stars n={r.stars} />
      <p>&ldquo;{r.quote}&rdquo;</p>
      <div className="who">{r.who}</div>
      <div className="what">{r.what}</div>
    </article>
  )
}

/** Reviews grid (static). */
export function ReviewGrid({ items }: { items: Review[] }) {
  return (
    <div className="grid-3">
      {items.map((r) => (
        <ReviewCard key={r.who} r={r} />
      ))}
    </div>
  )
}

/**
 * Reviews as a continuous right-to-left marquee with fade-in/out edges.
 * The item list is duplicated once so the CSS animation can loop seamlessly (translateX(-50%)
 * lands exactly on the start of the second copy). Pauses on hover; respects reduced-motion
 * (falls back to a static, wrapping row). Full-bleed so the edge fade sits at the viewport sides.
 */
export function ReviewMarquee({ items }: { items: Review[] }) {
  if (items.length === 0) return null
  const loop = [...items, ...items]
  return (
    <div className="review-marquee" aria-label="Klantbeoordelingen">
      <div className="review-marquee-track">
        {loop.map((r, i) => (
          <div className="review-marquee-item" key={`${r.who}-${i}`} aria-hidden={i >= items.length}>
            <ReviewCard r={r} />
          </div>
        ))}
      </div>
    </div>
  )
}

/** Location cards. */
export function LocationCards({ items }: { items: Location[] }) {
  return (
    <div className="grid-2">
      {items.map((l) => (
        <article className="loc-card" key={l.name}>
          <div className="city">{l.city}</div>
          <h3>{l.name}</h3>
          <ul>
            <li><Icon name="pin" size={18} /><span>{l.address}, {l.postcode}</span></li>
            <li><Icon name="phone" size={18} /><span>{l.phone}</span></li>
            <li><Icon name="clock" size={18} /><span>{l.hours}</span></li>
          </ul>
          <div style={{ marginTop: 22 }}>
            <a className="link-arrow" href={l.mapUrl} target="_blank" rel="noreferrer">
              Bekijk op de kaart <Icon name="arrow" size={16} />
            </a>
          </div>
        </article>
      ))}
    </div>
  )
}

/** Dark CTA band used at the bottom of most pages. */
export function CtaBand({ cta }: { cta: CtaBlock }) {
  return (
    <section className="section cta-band">
      <div className="container">
        <div className="cta-inner">
          {cta.script && <span className="script">{cta.script}</span>}
          <h2>{cta.title}</h2>
          <p>{cta.text}</p>
          <div className="cta-actions">
            <LocaleLink className="btn btn-gold" href={cta.primaryUrl}>{cta.primaryLabel}</LocaleLink>
            {cta.secondaryLabel && cta.secondaryUrl && (
              <LocaleLink className="btn btn-light" href={cta.secondaryUrl}>{cta.secondaryLabel}</LocaleLink>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Interior-page hero (breadcrumb + title + intro), dark band. */
export function PageHero({ eyebrow, title, text, breadcrumb }: { eyebrow: string; title: string; text: string; breadcrumb: string }) {
  return (
    <section className="pagehero">
      <div className="container">
        <div className="pagehero-inner">
          <div className="breadcrumb"><LocaleLink href="/">Home</LocaleLink><span>/</span><span>{breadcrumb}</span></div>
          <span className="eyebrow" style={{ marginTop: 14 }}>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{text}</p>
        </div>
      </div>
    </section>
  )
}

/** Numbered step list (treatment/training "hoe werkt het"). */
export function Steps({ title, items }: { title: string; items: Step[] }) {
  return (
    <div>
      {title && <h2 style={{ marginBottom: 20 }}>{title}</h2>}
      <div className="steps">
        {items.map((s, i) => (
          <div className="step" key={s.title}>
            <div className="n">{i + 1}</div>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** FAQ accordion-style list (rendered open — no JS needed, SEO-friendly). */
export function FaqList({ title, items }: { title: string; items: Faq[] }) {
  return (
    <div>
      {title && <h2 style={{ marginBottom: 12 }}>{title}</h2>}
      {items.map((f) => (
        <div className="faq-item" key={f.q}>
          <h3>{f.q}</h3>
          <p>{f.a}</p>
        </div>
      ))}
    </div>
  )
}

/** Price groups → clean price rows. */
export function PriceList({ groups }: { groups: PriceGroup[] }) {
  return (
    <div style={{ display: 'grid', gap: 46 }}>
      {groups.map((g) => (
        <div key={g.heading}>
          <h2 style={{ marginBottom: 18 }}>{g.heading}</h2>
          <div className="pricelist">
            {g.items.map((it) => (
              <div className="price-row" key={it.name}>
                <div>
                  <div className="name">{it.name}</div>
                  {it.desc && <div className="desc">{it.desc}</div>}
                </div>
                <div className="amount">{it.amount}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Masonry gallery. Empty entries render a blank placeholder tile (never a broken image). */
export function Gallery({ images }: { images: string[] }) {
  return (
    <div className="gallery">
      {images.map((src, i) =>
        (src ?? '').trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" />
        ) : (
          <Media key={i} src="" shape="square" label="Foto" />
        ),
      )}
    </div>
  )
}

/**
 * Generic hub page (Behandelingen / Opleidingen / Online Trainingen). Driven by HubContent:
 * a page hero, optional intro, one or more titled groups of link-cards, and a closing CTA.
 */
export function HubPage({ data }: { data: HubContent }) {
  return (
    <>
      <PageHero {...data.hero} />
      <section className="section">
        <div className="container">
          {data.intro && (
            <div className="section-head center" style={{ marginBottom: 50 }}>
              <h2>{data.intro.title}</h2>
              <p>{data.intro.text}</p>
            </div>
          )}
          <div style={{ display: 'grid', gap: 70 }}>
            {data.groups.map((g) => (
              <div key={g.heading}>
                <div className="section-head" style={{ marginBottom: 30 }}>
                  <h2>{g.heading}</h2>
                  {g.text && <p>{g.text}</p>}
                </div>
                <CardGrid items={g.items} />
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaBand cta={data.cta} />
    </>
  )
}

/**
 * Generic treatment/training detail page. Driven by DetailContent: hero, lead image, prose
 * body sections, optional steps + FAQ, and a sticky aside with facts + a booking CTA.
 */
export function DetailPage({ data }: { data: DetailContent }) {
  // Inschrijven kan alleen als er een product aan hangt ÉN de webshop van deze tenant aan staat —
  // anders wijst de knop naar /product/<handle>, en dat is een 404 zolang de shop uit is.
  const bookable = !!data.productHandle && commerceEnabled()
  const highlights = data.highlights ?? []
  return (
    <>
      <PageHero {...data.hero} />
      {/* Direct onder de hero, vóór de lopende tekst: UWV-subsidie en gespreid betalen zijn voor
          een cursist vaak de reden dát de opleiding haalbaar is. In de zijbalk of pas bij het
          afrekenen komen ze te laat — zie de opdracht, punt 6 en 14. */}
      {highlights.length > 0 && (
        <div className="highlight-band">
          <div className="container highlight-row">
            {highlights.map((h) => (
              <div className="highlight" key={h.label}>
                <span className="highlight-tick" aria-hidden="true"><Icon name="check" size={13} /></span>
                <span>
                  <b>{h.label}</b>
                  <span className="highlight-text">{h.text}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      <section className="section">
        <div className="container">
          <div className="detail-grid">
            <div className="prose">
              <div className="detail-figure">
                <Media src={data.image} alt={data.hero.title} shape="wide" label={data.hero.title} />
              </div>
              {data.intro && <p className="lead" style={{ marginBottom: 8 }}>{data.intro}</p>}
              {data.body.map((b) => (
                <div key={b.heading}>
                  <h2>{b.heading}</h2>
                  {b.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {b.checklist && b.checklist.length > 0 && (
                    <ul className="checklist">
                      {b.checklist.map((c) => (
                        <li key={c}>
                          <span className="tick"><Icon name="check" size={13} /></span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {data.steps && data.steps.items.length > 0 && (
                <div style={{ marginTop: 44 }}>
                  <Steps title={data.steps.title} items={data.steps.items} />
                </div>
              )}
              {/* De video staat tussen de uitleg en de vragen: wie tot hier leest wil zien hoe het
                  gaat, en wie alleen een vraag heeft scrollt er langs. */}
              {data.videoUrl && (
                <div style={{ marginTop: 44 }}>
                  <VideoEmbed title={data.hero.title} url={data.videoUrl} />
                </div>
              )}
              {data.faq && data.faq.items.length > 0 && (
                <div style={{ marginTop: 44 }}>
                  <FaqList title={data.faq.title} items={data.faq.items} />
                </div>
              )}
            </div>

            <aside className="aside">
              <div className="aside-card">
                <h4>{data.aside.factsTitle}</h4>
                <ul className="aside-facts">
                  {data.aside.facts.map((f) => (
                    <li key={f.k}>
                      <span className="k">{f.k}</span>
                      <span className="v">{f.v}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="aside-card dark">
                <h4>{data.aside.ctaTitle}</h4>
                <p>{data.aside.ctaText}</p>
                {/* Is deze opleiding aan een webshopproduct gekoppeld, dan gaat de knop naar de
                    productpagina: daar kiest de bezoeker cursusdatum en locatie (de varianten) en
                    rekent hij af. Zonder koppeling — of met de webshop uit — blijft het de
                    contactknop, zodat er nooit een dode inschrijflink op de pagina staat. */}
                {bookable ? (
                  <>
                    <LocaleLink className="btn btn-gold" href={`/product/${data.productHandle}`}>
                      Inschrijven
                    </LocaleLink>
                    <LocaleLink className="btn btn-light aside-cta-secondary" href={data.aside.ctaUrl}>
                      {data.aside.ctaLabel}
                    </LocaleLink>
                  </>
                ) : (
                  <LocaleLink className="btn btn-gold" href={data.aside.ctaUrl}>{data.aside.ctaLabel}</LocaleLink>
                )}
              </div>
            </aside>
          </div>
        </div>
      </section>
      <CtaBand cta={data.cta} />
    </>
  )
}

/** Legal / plain-text page (voorwaarden, privacy). Simple prose sections under a page hero. */
export function LegalPage({ data }: { data: LegalContent }) {
  return (
    <>
      <PageHero {...data.hero} />
      <section className="section">
        <div className="container" style={{ maxWidth: 780 }}>
          <div className="prose">
            {data.sections.map((s) => (
              <div key={s.heading}>
                <h2>{s.heading}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

/** Flexible info page (Werken Bij, UWV Subsidie, GGD, FAQ). Hero + optional image + prose
 *  body + optional FAQ + CTA. */
export function InfoPage({ data }: { data: InfoContent }) {
  return (
    <>
      <PageHero {...data.hero} />
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          {/* `info-figure`, niet `detail-figure`: de beelden op deze pagina's zijn VIERKANT (een
              teamportret, een keurmerklogo) en `detail-figure` snijdt met `object-fit: cover` een
              band van 340px uit het midden — precies waar bij een portret het hoofd zit. */}
          {data.image !== undefined && (
            <div className="info-figure">
              <Media src={data.image} alt={data.hero.title} shape="square" label={data.hero.title} />
            </div>
          )}
          <div className="prose">
            {(data.body ?? []).map((b) => (
              <div key={b.heading}>
                <h2>{b.heading}</h2>
                {b.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {b.checklist && b.checklist.length > 0 && (
                  <ul className="checklist">
                    {b.checklist.map((c) => (
                      <li key={c}>
                        <span className="tick"><Icon name="check" size={13} /></span>
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          {/* Teamfoto's onder de tekst: de bio's staan hierboven al per persoon, dus dit blok zet
              er de gezichten bij in plaats van de namen te herhalen. */}
          {data.team && data.team.length > 0 && (
            <div className="team-grid" style={{ marginTop: 44 }}>
              {data.team.map((m) => (
                <div className="team-card" key={m.name}>
                  <Media src={m.image} alt={m.name} shape="portrait" label={m.name} />
                  <h3>{m.name}</h3>
                  <p>{m.role}</p>
                </div>
              ))}
            </div>
          )}
          {/* De video's zelf, niet alleen een link naar het kanaal: wie op "Video's" klikt, komt
              kijken. `VideoEmbed` rendert niets bij een onbruikbare URL, dus een verkeerd geplakte
              link levert hier geen leeg kader op. */}
          {data.videos && data.videos.length > 0 && (
            <div className="video-list" style={{ marginTop: 44 }}>
              {data.videos.map((v) => (
                <figure className="video-item" key={v.url}>
                  <VideoEmbed title={v.title} url={v.url} />
                  <figcaption>
                    <h3>{v.title}</h3>
                    {v.description && <p>{v.description}</p>}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {/* Reviews onder de tekst: eerst waar de pagina over gaat, dan het bewijs. Hergebruikt
              ReviewGrid, die al in de codebase stond maar nergens gebruikt werd. */}
          {data.reviews && data.reviews.items.length > 0 && (
            <div style={{ marginTop: 44 }}>
              {data.reviews.title && <h2 style={{ marginBottom: 20 }}>{data.reviews.title}</h2>}
              <ReviewGrid items={data.reviews.items} />
            </div>
          )}
          {data.faq && data.faq.items.length > 0 && (
            <div style={{ marginTop: 44 }}>
              <FaqList title={data.faq.title} items={data.faq.items} />
            </div>
          )}
        </div>
      </section>
      <CtaBand cta={data.cta} />
    </>
  )
}

/** SEO location page (Wenkbrauwen <stad>, Permanente Make-up <stad>). Locale-specific hero +
 *  prose + a single location card + FAQ + CTA. */
export function LocationPage({ data }: { data: LocationPageContent }) {
  return (
    <>
      <PageHero {...data.hero} />
      <section className="section">
        <div className="container">
          <div className="detail-grid">
            <div className="prose">
              <div className="detail-figure">
                <Media src={data.image} alt={data.hero.title} shape="wide" label={data.hero.title} />
              </div>
              {data.intro && <p className="lead" style={{ marginBottom: 8 }}>{data.intro}</p>}
              {data.body.map((b) => (
                <div key={b.heading}>
                  <h2>{b.heading}</h2>
                  {b.paragraphs.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {b.checklist && b.checklist.length > 0 && (
                    <ul className="checklist">
                      {b.checklist.map((c) => (
                        <li key={c}>
                          <span className="tick"><Icon name="check" size={13} /></span>
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {data.faq && data.faq.items.length > 0 && (
                <div style={{ marginTop: 44 }}>
                  <FaqList title={data.faq.title} items={data.faq.items} />
                </div>
              )}
            </div>
            <aside className="aside">
              <div className="aside-card">
                <h4>{data.location.name}</h4>
                <ul className="aside-facts">
                  <li><span className="k">Adres</span><span className="v">{data.location.address}</span></li>
                  <li><span className="k">Plaats</span><span className="v">{data.location.postcode}</span></li>
                  <li><span className="k">Telefoon</span><span className="v">{data.location.phone}</span></li>
                  <li><span className="k">Openingstijden</span><span className="v">{data.location.hours}</span></li>
                </ul>
                <div style={{ marginTop: 18 }}>
                  <a className="link-arrow" href={data.location.mapUrl} target="_blank" rel="noreferrer">
                    Bekijk op de kaart <Icon name="arrow" size={16} />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
      <CtaBand cta={data.cta} />
    </>
  )
}

type BlogCard = { slug: string; title: string; excerpt: string; image: string; date: string; category?: string }

/** Slug for an in-page heading anchor, so the table of contents can jump to it. */
function headingId(heading: string, i: number): string {
  const base = heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return base ? `sectie-${base}` : `sectie-${i + 1}`
}

/** Dutch long-form date ("26 november 2025") from an ISO `YYYY-MM-DD` string.
 *  Falls back to the raw value if the date isn't parseable, so odd CMS input never renders "Invalid Date". */
const NL_MONTHS = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((iso ?? '').trim())
  if (!m) return iso
  const month = NL_MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : iso
}

/** Rough read time from the excerpt length — enough to set expectations, never shown as exact. */
function readTime(text: string): string {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(2, Math.round((words * 8) / 200))} min lezen`
}

/** Meta row: date, then any extra items separated by a small gold dot. */
function BlogMeta({ date, extra }: { date: string; extra?: string }) {
  return (
    <div className="blog-meta">
      <time dateTime={date}>{formatDate(date)}</time>
      {extra && (
        <>
          <span className="dot" aria-hidden="true" />
          <span>{extra}</span>
        </>
      )}
    </div>
  )
}

/** Single article card — image, meta row, clamped excerpt, and a bottom-anchored read action.
 *  The title carries a stretched link so the whole card is clickable while the footer keeps
 *  the visible affordance. */
function BlogCard({ p }: { p: BlogCard }) {
  return (
    <article className="blog-card">
      <div className="blog-card-media">
        <Media src={p.image} alt={p.title} shape="free" label={p.title} />
      </div>
      <div className="blog-card-body">
        <BlogMeta date={p.date} />
        <h3><LocaleLink href={`/${p.slug}`}>{p.title}</LocaleLink></h3>
        <p>{p.excerpt}</p>
      </div>
      <div className="blog-card-foot">
        <ArrowLink url={`/${p.slug}`} label="Lees artikel" />
        <span className="blog-readtime">{readTime(p.excerpt)}</span>
      </div>
    </article>
  )
}

/** Posts shown per page on the blog index (3-column grid × 4 rows). */
export const POSTS_PER_PAGE = 12

/** Newest-first ordering, shared by the index pages and the post prev/next links. */
export function sortPostsByDate<T extends { date?: string }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
}

/**
 * Page numbers to render, with `null` marking an ellipsis gap. Always shows the first and
 * last page plus a window around the current one, so the control stays compact for 50+ pages.
 */
function pageItems(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | null)[] = [1]
  const from = Math.max(2, current - 1)
  const to = Math.min(total - 1, current + 1)
  if (from > 2) out.push(null)
  for (let i = from; i <= to; i++) out.push(i)
  if (to < total - 1) out.push(null)
  out.push(total)
  return out
}

/** Href for a blog index page — page 1 is the bare /blog, the rest are /blog/page/<n>. */
function pageHref(n: number): string {
  return n <= 1 ? '/blog' : `/blog/page/${n}`
}

/** Numbered pagination control (prev / pages / next). Plain links — no JS. */
function Pagination({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null
  return (
    <nav className="pagination" aria-label="Paginering">
      {current > 1 ? (
        <LocaleLink className="page-arrow" href={pageHref(current - 1)} rel="prev" aria-label="Vorige pagina">
          <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
          <span>Vorige</span>
        </LocaleLink>
      ) : (
        <span className="page-arrow is-disabled" aria-hidden="true">
          <Icon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }} />
          <span>Vorige</span>
        </span>
      )}

      <ol className="page-numbers">
        {pageItems(current, total).map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} className="page-gap" aria-hidden="true">…</li>
          ) : (
            <li key={n}>
              {n === current ? (
                <span className="page-num is-current" aria-current="page">{n}</span>
              ) : (
                <LocaleLink className="page-num" href={pageHref(n)}>{n}</LocaleLink>
              )}
            </li>
          ),
        )}
      </ol>

      {current < total ? (
        <LocaleLink className="page-arrow" href={pageHref(current + 1)} rel="next" aria-label="Volgende pagina">
          <span>Volgende</span>
          <Icon name="arrow" size={16} />
        </LocaleLink>
      ) : (
        <span className="page-arrow is-disabled" aria-hidden="true">
          <span>Volgende</span>
          <Icon name="arrow" size={16} />
        </span>
      )}
    </nav>
  )
}

/**
 * Blog index — a paginated grid of article cards.
 *
 * `posts` is the FULL newest-first list; this component slices the window for `page` itself so
 * every index page shares one ordering. Pagination is plain links to /blog and /blog/page/<n>,
 * so the whole thing stays a server component and each page is separately indexable.
 */
export function BlogGrid({ posts, page = 1 }: { posts: BlogCard[]; page?: number }) {
  if (posts.length === 0) return null

  const sorted = sortPostsByDate(posts)
  const totalPages = Math.max(1, Math.ceil(sorted.length / POSTS_PER_PAGE))
  const current = Math.min(Math.max(1, page), totalPages)
  const start = (current - 1) * POSTS_PER_PAGE
  const slice = sorted.slice(start, start + POSTS_PER_PAGE)

  return (
    <div className="blog-index">
      <div className="blog-toolbar">
        <div className="blog-toolbar-title">Alle artikelen</div>
        <div className="blog-count">
          {sorted.length} artikelen
          {totalPages > 1 && <> · pagina {current} van {totalPages}</>}
        </div>
      </div>

      <div className="blog-grid">
        {slice.map((p) => (
          <BlogCard key={p.slug} p={p} />
        ))}
      </div>

      <Pagination current={current} total={totalPages} />
    </div>
  )
}

/** One post as shown on its own page, plus the neighbours used for prev/next links. */
type BlogPostData = {
  title: string
  excerpt: string
  image: string
  author: string
  date: string
  category?: string
  body: { heading?: string; paragraphs: string[] }[]
}

/**
 * Blog post (detail) page body — everything below the page hero.
 *
 * Two columns: the article itself, and a sticky sidebar holding a table of contents (generated
 * from the post's own headings), the author, and the booking CTA. The lead figure deliberately
 * overlaps the dark hero above so the two bands read as one composition. The article closes with
 * a proper action bar (back + book) and prev/next cards rather than a single stray button.
 */
export function BlogPostPage({
  post,
  prev,
  next,
  cta,
}: {
  post: BlogPostData
  prev?: { slug: string; title: string }
  next?: { slug: string; title: string }
  /** Booking CTA shown in the sidebar + the closing action bar. */
  cta: { title: string; text: string; label: string; url: string }
}) {
  // Only headed sections get a TOC entry; a post with one section doesn't need one at all.
  const sections = post.body
    .map((b, i) => ({ heading: b.heading?.trim(), id: headingId(b.heading ?? '', i) }))
    .filter((s): s is { heading: string; id: string } => Boolean(s.heading))
  const showToc = sections.length > 2

  const words = post.body.reduce((a, b) => a + b.paragraphs.join(' ').split(/\s+/).length, 0)
  const mins = Math.max(1, Math.round(words / 200))

  const related = getCategoryLinks(post.category ?? '')

  return (
    <>
      <section className="section post-section">
        <div className="container">
          <div className="post-layout">
            <article>
              <div className="post-figure">
                <Media src={post.image} alt={post.title} shape="wide" label={post.title} />
              </div>

              <div className="post-meta">
                {post.category && <span className="post-meta-chip">{post.category}</span>}
                <span className="post-meta-item">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                </span>
                <span className="dot" aria-hidden="true" />
                <span className="post-meta-item">{post.author}</span>
                <span className="dot" aria-hidden="true" />
                <span className="post-meta-item">{mins} min lezen</span>
              </div>

              <div className="prose post-body">
                {post.body.map((b, i) => (
                  <div key={i}>
                    {b.heading && <h2 id={headingId(b.heading, i)}>{b.heading}</h2>}
                    {b.paragraphs.map((p, j) => (
                      <p key={j}>{p}</p>
                    ))}
                  </div>
                ))}
              </div>

              {/* Van lezen naar doen: wie een artikel over nazorg uitleest, is met een behandeling
                  bezig. De weg daarheen hoort op de pagina te staan, niet alleen in het menu.
                  Zie CATEGORY_LINKS in content/blog.ts — elke URL daar is gecontroleerd. */}
              {related.length > 0 && (
                <div className="kb-related">
                  <h3>Meer over dit onderwerp</h3>
                  <div className="kb-related-links">
                    {related.map((r) => (
                      <LocaleLink className="kb-related-link" href={r.url} key={r.url}>
                        {r.label}
                      </LocaleLink>
                    ))}
                  </div>
                </div>
              )}

              <div className="post-actions">
                <LocaleLink className="btn btn-ghost" href="/blog">Terug naar de blog</LocaleLink>
                <LocaleLink className="btn btn-gold" href={cta.url}>{cta.label}</LocaleLink>
              </div>

              {(prev || next) && (
                <nav className="post-nav" aria-label="Meer artikelen">
                  {prev && (
                    <LocaleLink className="post-nav-card" href={`/${prev.slug}`}>
                      <span className="dir">Vorig artikel</span>
                      <span className="t">{prev.title}</span>
                    </LocaleLink>
                  )}
                  {next && (
                    <LocaleLink className="post-nav-card is-next" href={`/${next.slug}`}>
                      <span className="dir">Volgend artikel</span>
                      <span className="t">{next.title}</span>
                    </LocaleLink>
                  )}
                </nav>
              )}
            </article>

            <aside className="post-aside">
              {showToc && (
                <nav className="post-toc" aria-label="Inhoudsopgave">
                  <h4>In dit artikel</h4>
                  <ol>
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`}>{s.heading}</a>
                      </li>
                    ))}
                  </ol>
                </nav>
              )}
              <div className="aside-card dark">
                <h4>{cta.title}</h4>
                <p>{cta.text}</p>
                <LocaleLink className="btn btn-gold" href={cta.url}>{cta.label}</LocaleLink>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
