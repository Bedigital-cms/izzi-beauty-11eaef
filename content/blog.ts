/** Blog index + posts — data lives in content/<locale>/blog.json (CMS + AI editable). `posts` is
 *  keyed by slug; add a key to publish a new /blog/<slug> article. */
import type { BlogCollection, BlogIndexContent } from '@/lib/types'

import { loadContent } from './load'

type BlogFile = { index: BlogIndexContent; posts: BlogCollection }

export function getBlogIndex(locale: string): BlogIndexContent {
  return loadContent<BlogFile>('blog', locale).index
}
/**
 * Alle artikelen, ook de concepten.
 *
 * Gebruik dit alleen waar je een post op slug opzoekt en de status zélf afhandelt (de detailroute
 * en de previewroute doen dat). Voor elk OVERZICHT: `getPublishedPosts`.
 */
export function getPosts(locale: string): BlogCollection {
  return loadContent<BlogFile>('blog', locale).posts
}

/** Is dit artikel zichtbaar voor bezoekers? Geen status = gepubliceerd. */
export function isPublished(post: { status?: string } | undefined): boolean {
  return !!post && post.status !== 'draft'
}

/**
 * Alleen de gepubliceerde artikelen.
 *
 * Dit is het punt waar concepten uit de site verdwijnen. Overzichten, de kennisbank, de
 * categorietellingen en `generateStaticParams` lopen allemaal hierlangs, zodat "verbergen" niet op
 * vier plaatsen los geregeld hoeft te worden — en er dus ook niet op één plek vergeten kan worden.
 */
export function getPublishedPosts(locale: string): BlogCollection {
  const posts = getPosts(locale)
  return Object.fromEntries(Object.entries(posts).filter(([, p]) => isPublished(p)))
}

export function getPostSlugs(locale: string): string[] {
  return Object.keys(getPublishedPosts(locale))
}

/** De categorieën die daadwerkelijk op een gepubliceerd artikel staan, met hun aantal. */
export function getBlogCategories(locale: string): { name: string; slug: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const post of Object.values(getPublishedPosts(locale))) {
    const name = (post.category ?? '').trim()
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: categorySlug(name), count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
}

/** Categorienaam → URL-segment. Eén functie, zodat link en route nooit uiteenlopen. */
export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Card-shaped view of every post, as the blog index grid consumes it. */
export function getBlogCards(locale: string) {
  const posts = getPublishedPosts(locale)
  return Object.keys(posts).map((slug) => ({
    slug,
    title: posts[slug].title,
    excerpt: posts[slug].excerpt,
    image: posts[slug].image,
    date: posts[slug].date,
    category: posts[slug].category,
  }))
}

/**
 * Waar een onderwerp uit de kennisbank naartoe wijst.
 *
 * De opdracht (punt 12) vraagt om logische interne links tussen de kennisbank, de behandelingen en
 * de opleidingen. Wie zeven artikelen over nazorg leest, is bezig met een behandeling — dan hoort
 * de weg daarheen op de pagina te staan en niet alleen in het menu.
 *
 * ⚠️ Elke URL hieronder is een pagina die BESTAAT (`services.json` / `trainings-detail.json`). Een
 * kapotte link is hier erger dan geen link: hij belooft verdieping en levert een 404.
 */
const CATEGORY_LINKS: Record<string, { label: string; url: string }[]> = {
  Wenkbrauwen: [
    { label: 'Ombré Powder Brows', url: '/powder-brows' },
    { label: 'Combi Brows', url: '/combi-brows-behandeling' },
    { label: 'Brow Lamination', url: '/brow-lamination-behandeling' },
    { label: 'Powder Brows opleiding', url: '/ombre-powder-brows-opleiding' },
  ],
  Lippen: [
    { label: 'Lip Blush', url: '/lip-blush' },
    { label: 'Lip Enlightenment', url: '/lip-enlightenment' },
    { label: 'Lip Blush opleiding', url: '/lip-blush-beginnersopleiding' },
  ],
  Nazorg: [
    { label: 'Powder Brows', url: '/powder-brows' },
    { label: 'Lip Blush', url: '/lip-blush' },
    { label: 'Veelgestelde vragen', url: '/veelgestelde-vragen' },
  ],
  Correctie: [
    { label: 'Kleurcorrectie PMU', url: '/kleurcorrectie' },
    { label: 'Cover oude PMU', url: '/cover-oude-permanente-make-up' },
    { label: 'PMU laseren', url: '/permanente-make-up-laseren' },
  ],
  Verwijderen: [
    { label: 'PMU laseren', url: '/permanente-make-up-laseren' },
    { label: 'Tattoo verwijderen', url: '/tattoo-verwijderen-rotterdam-amsterdam' },
    { label: 'Saline Removal opleiding', url: '/saline-removal' },
  ],
  Microblading: [
    { label: 'Ombré Powder Brows', url: '/powder-brows' },
    { label: 'Combi Brows', url: '/combi-brows-behandeling' },
  ],
  'Faux Freckles': [
    { label: 'Faux Freckles', url: '/faux-freckles-behandeling' },
    { label: 'Faux Freckles opleiding', url: '/faux-freckles-beginners' },
  ],
  Wimpers: [
    { label: 'Infralash Eyeliner', url: '/infralash-eyeliner' },
    { label: 'Lash Lift training', url: '/lash-lift-training' },
  ],
  Opleidingen: [
    { label: 'Alle opleidingen', url: '/opleidingen' },
    { label: 'All Round PMU', url: '/allround-pmu-opleiding' },
    { label: 'UWV-subsidie', url: '/uwv-subsidie' },
  ],
  'Online Trainingen': [
    { label: 'Online trainingen', url: '/online-trainingen' },
    { label: 'Airbrush Brows online', url: '/airbrush-brows-online-training' },
  ],
  'Permanente Make Up': [
    { label: 'Alle behandelingen', url: '/behandelingen' },
    { label: 'Prijzen', url: '/prijzen' },
    { label: 'Veelgestelde vragen', url: '/veelgestelde-vragen' },
  ],
  Behandelingen: [
    { label: 'Alle behandelingen', url: '/behandelingen' },
    { label: 'Prijzen', url: '/prijzen' },
  ],
  Tips: [
    { label: 'Alle behandelingen', url: '/behandelingen' },
    { label: 'Veelgestelde vragen', url: '/veelgestelde-vragen' },
  ],
}

/** De behandel- en opleidingspagina's die bij dit onderwerp horen. Leeg als er geen match is. */
export function getCategoryLinks(category: string): { label: string; url: string }[] {
  return CATEGORY_LINKS[category] ?? []
}
