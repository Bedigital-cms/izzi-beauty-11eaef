import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { LegalPage } from '@/components/sections'
import { getLegal } from '@/content/legal'

const KEY = 'algemene-voorwaarden'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getLegal(locale)[KEY]
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Shell locale={locale}>
      <LegalPage data={getLegal(locale)[KEY]} />
    </Shell>
  )
}
