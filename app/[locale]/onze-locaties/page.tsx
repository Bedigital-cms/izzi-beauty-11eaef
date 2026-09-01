import type { Metadata } from 'next'

import { Shell } from '@/components/Shell'
import { HubPage } from '@/components/sections'
import { getLocaties } from '@/content/locaties'
import { getSite } from '@/content/site'
import type { HubContent, LinkCard } from '@/lib/types'

/**
 * Onze locaties — de salons plus het verzorgingsgebied.
 *
 * De brief vraagt deze pagina onder "Over IZZI". Hij bouwt zichzelf op uit twee bronnen die er al
 * zijn: de vestigingen in `site.json` bepalen wélke plaatsen een eigen salon hebben, en
 * `locaties.json` levert de stadspagina's. Geen derde contentbestand, dus niets dat uit de pas kan
 * gaan lopen met de footer of met de SEO-pagina's.
 */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const site = getSite(locale)
  return {
    title: `Onze locaties — ${site.brandName}`,
    description: `Bekijk alle locaties en het verzorgingsgebied van ${site.brandName}.`,
  }
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const site = getSite(locale)
  const locaties = getLocaties(locale)

  const salonCities = new Set((site.footer.locations ?? []).map((l) => l.city.toLowerCase()))

  /** Staat er in deze plaats een eigen studio, of hoort hij bij het verzorgingsgebied? */
  const isSalon = (page: (typeof locaties)[string]) =>
    salonCities.has((page.city ?? '').toLowerCase())

  /**
   * Eén stadspagina → één kaart.
   *
   * ⚠️ De titel is de STAD, niet `location.name`.
   *
   * Elke SEO-stadspagina draagt een `location`-blok, maar dat beschrijft de studio die die plaats
   * BEDIENT — voor veertien van de vijftien plaatsen is dat dezelfde vestiging in Amsterdam. Met
   * `location.name` als titel geeft het verzorgingsgebied veertien identieke kaarten
   * "IZZI Beauty Amsterdam", allemaal met hetzelfde adres, en klaagt React terecht over dubbele
   * keys. Wat de bezoeker hier zoekt is zijn eigen plaats.
   *
   * Bij een salon is de stad óók de vestiging, dus daar klopt het vanzelf.
   */
  const toCard = ([slug, page]: [string, (typeof locaties)[string]]): LinkCard => ({
    title: page.city || page.location?.name || slug,
    // Bij een salon zegt de postcode iets; bij een plaats in het verzorgingsgebied is het de
    // postcode van een studio elders, en dat is misleidend. Dan liever niets.
    meta: isSalon(page) ? (page.location?.postcode ?? '') : '',
    text: isSalon(page) ? (page.location?.address ?? page.hero.text) : page.hero.text,
    image: page.image || '',
    url: `/${slug}`,
    linkLabel: isSalon(page) ? 'Bekijk locatie' : 'Bekijk pagina',
  })

  const entries = Object.entries(locaties)
  const salons = entries.filter(([, p]) => isSalon(p))
  const area = entries.filter(([, p]) => !isSalon(p))

  const data: HubContent = {
    hero: {
      eyebrow: 'Over IZZI',
      title: 'Onze locaties',
      text: 'Bezoek ons in de salon of bekijk in welke plaatsen we actief zijn.',
      breadcrumb: 'Onze locaties',
    },
    intro: {
      title: 'Waar kun je ons vinden?',
      text: 'Onze salons zijn gemakkelijk bereikbaar. Daarnaast komen klanten uit de hele regio naar ons toe.',
    },
    groups: [
      ...(salons.length ? [{ heading: 'Onze salons', items: salons.map(toCard) }] : []),
      ...(area.length
        ? [
            {
              heading: 'Ons verzorgingsgebied',
              text: 'Ook uit deze plaatsen komen klanten naar onze salons.',
              items: area.map(toCard),
            },
          ]
        : []),
    ],
    cta: {
      script: 'Klaar voor de volgende stap?',
      title: 'Maak vrijblijvend een afspraak',
      text: 'Tijdens een persoonlijk intakegesprek bespreken we jouw wensen en adviseren we de beste behandeling.',
      primaryLabel: 'Afspraak maken',
      primaryUrl: '/contact',
      secondaryLabel: 'Neem contact op',
      secondaryUrl: '/contact',
    },
  }

  return (
    <Shell locale={locale}>
      <HubPage data={data} />
    </Shell>
  )
}
