import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { CtaBand, Gallery, PageHero } from '@/components/sections'
import { getPortfolio } from '@/content/portfolio'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getPortfolio(locale)
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const portfolio = getPortfolio(locale)
  return (
    <Shell locale={locale}>
      <PageHero {...portfolio.hero} />
      <section className="section">
        <div className="container">
          {portfolio.intro && (
            <p className="lead" style={{ maxWidth: '44rem', marginBottom: 44 }}>{portfolio.intro}</p>
          )}
          <Gallery images={portfolio.images} />
        </div>
      </section>
      <CtaBand cta={portfolio.cta} />
    </Shell>
  )
}
