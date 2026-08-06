import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { HubPage } from '@/components/sections'
import { getOpleidingen } from '@/content/opleidingen'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getOpleidingen(locale)
  return { title: `${data.hero.title} — IZZI Beauty Academy`, description: data.hero.text }
}

export default async function OpleidingenPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Shell locale={locale}>
      <HubPage data={getOpleidingen(locale)} />
    </Shell>
  )
}
