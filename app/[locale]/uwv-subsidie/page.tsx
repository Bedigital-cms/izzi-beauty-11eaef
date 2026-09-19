import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { InfoPage } from '@/components/sections'
import { getInfo } from '@/content/info'
import { pageAlternates } from '@/lib/seo'

const KEY = 'uwv-subsidie'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getInfo(locale)[KEY]
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text, alternates: pageAlternates('/uwv-subsidie', locale) }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Shell locale={locale}>
      <InfoPage data={getInfo(locale)[KEY]} />
    </Shell>
  )
}
