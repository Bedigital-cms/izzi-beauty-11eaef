import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { CtaBand, PageHero, PriceList } from '@/components/sections'
import { getPrijzen } from '@/content/prijzen'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getPrijzen(locale)
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function PrijzenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const prijzen = getPrijzen(locale)
  return (
    <Shell locale={locale}>
      <PageHero {...prijzen.hero} />
      <section className="section">
        <div className="container" style={{ maxWidth: 820 }}>
          <PriceList groups={prijzen.groups} />
          {prijzen.note && (
            <p className="lead" style={{ marginTop: 36, fontSize: '0.98rem' }}>{prijzen.note}</p>
          )}
        </div>
      </section>
      <CtaBand cta={prijzen.cta} />
    </Shell>
  )
}
