import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { HubPage } from '@/components/sections'
import { getOnlineTrainingen } from '@/content/online-trainingen'
import { pageAlternates } from '@/lib/seo'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getOnlineTrainingen(locale)
  return { title: `${data.hero.title} — IZZI Beauty Academy`, description: data.hero.text, alternates: pageAlternates('/online-trainingen', locale) }
}

export default async function OnlineTrainingenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Shell locale={locale}>
      <HubPage data={getOnlineTrainingen(locale)} />
    </Shell>
  )
}
