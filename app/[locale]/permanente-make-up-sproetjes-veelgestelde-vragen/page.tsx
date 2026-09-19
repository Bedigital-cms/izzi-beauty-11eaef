import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { InfoPage } from '@/components/sections'
import { getInfo } from '@/content/info'
import { pageAlternates } from '@/lib/seo'

const KEY = 'permanente-make-up-sproetjes-veelgestelde-vragen'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getInfo(locale)[KEY]
  const title = 'Veelgestelde Vragen Permanente Make Up Sproetjes — IZZI Beauty'
  return {
    title,
    description: data.hero.text,
    openGraph: { title, description: data.hero.text },
    alternates: pageAlternates('/permanente-make-up-sproetjes-veelgestelde-vragen', locale),
  }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Shell locale={locale}>
      <InfoPage data={getInfo(locale)[KEY]} />
    </Shell>
  )
}
