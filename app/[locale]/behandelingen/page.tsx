import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { HubPage } from '@/components/sections'
import { getBehandelingen } from '@/content/behandelingen'
import { pageAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getBehandelingen(locale)
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text, alternates: pageAlternates('/behandelingen', locale) }
}

export default async function BehandelingenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Shell locale={locale}>
      <HubPage data={getBehandelingen(locale)} />
    </Shell>
  )
}
