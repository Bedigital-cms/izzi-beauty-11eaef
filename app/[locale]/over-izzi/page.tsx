import type { Metadata } from 'next'

import { Icon } from '@/components/icons'
import { Media } from '@/components/Media'
import { Shell } from '@/components/Shell'
import { CtaBand, PageHero } from '@/components/sections'
import { getOver } from '@/content/over'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getOver(locale)
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function OverPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const over = getOver(locale)
  const { story, values, stats, founder, cta } = over
  return (
    <Shell locale={locale}>
      <PageHero {...over.hero} />

      {/* Story — split with badge */}
      <section className="section">
        <div className="container">
          <div className="split">
            <div className="split-media">
              <Media src={story.image} alt={story.title} shape="portrait" label={story.title} />
              <div className="badge">
                <div className="num">{story.badgeNum}</div>
                <div className="lbl">{story.badgeLabel}</div>
              </div>
            </div>
            <div className="split-body">
              <span className="eyebrow">{story.eyebrow}</span>
              <h2>{story.title}</h2>
              {story.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section" style={{ background: 'var(--champagne)' }}>
        <div className="container">
          <div className="section-head center">
            <span className="eyebrow center">{values.eyebrow}</span>
            <h2>{values.title}</h2>
            <p>{values.text}</p>
          </div>
          <div className="grid-4">
            {values.items.map((v) => (
              <div className="feature" key={v.title}>
                <div className="feature-icon"><Icon name={v.icon} size={24} /></div>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
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

      {/* Founder — reversed split */}
      <section className="section">
        <div className="container">
          <div className="split reverse">
            <div className="split-body">
              <span className="eyebrow">{founder.eyebrow}</span>
              <h2>{founder.title}</h2>
              {founder.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <div style={{ marginTop: 18 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem' }}>{founder.name}</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>{founder.role}</div>
              </div>
            </div>
            <div className="split-media">
              <Media src={founder.image} alt={founder.name} shape="portrait" label={founder.name} />
            </div>
          </div>
        </div>
      </section>

      <CtaBand cta={cta} />
    </Shell>
  )
}
