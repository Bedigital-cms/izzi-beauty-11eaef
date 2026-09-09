import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Shell } from '@/components/Shell'
import { InfoPage } from '@/components/sections'
import { getInfo } from '@/content/info'

/**
 * Ervaringen — klantreviews, als los te vinden pagina onder Over IZZI.
 *
 * Zelfde opzet als /ons-team, /werkwijze en /videos: één sleutel in content/<locale>/info.json,
 * gerenderd door InfoPage. De reviews zelf staan in het veld `reviews` van die sleutel.
 *
 * ⚠️ De sleutel bestaat pas zodra iemand hem in het CMS aanmaakt. Daarom staat er hier een
 * `notFound()` en niet de gebruikelijke directe toegang: zonder dat vangnet zou deze route de
 * build van de hele site laten falen tot de content er is — en dat blokkeert óók het publiceren
 * van contentwijzigingen door de klant zelf. Nu geeft de pagina een nette 404 tot ze gevuld is en
 * verschijnt ze vanzelf zodra dat gebeurt.
 */
const KEY = 'ervaringen'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const data = getInfo(locale)[KEY]
  if (!data) return {}
  return { title: `${data.hero.title} — IZZI Beauty`, description: data.hero.text }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const data = getInfo(locale)[KEY]
  if (!data) notFound()
  return (
    <Shell locale={locale}>
      <InfoPage data={data} />
    </Shell>
  )
}
