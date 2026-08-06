import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { InfoPage } from '@/components/sections'
import { getInfo } from '@/content/info'

/**
 * FAQ van de wenkbrauwen-opleidingen, genest zoals op de oorspronkelijke site
 * (/online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen). Dit is de
 * enige URL van deze pagina; de eerdere vlakke variant bestaat niet meer.
 */
const KEY = 'online-trainingen-veelgestelde-vragen'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getInfo(locale)[KEY]
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <Shell locale={locale}>
      <InfoPage data={getInfo(locale)[KEY]} />
    </Shell>
  )
}
