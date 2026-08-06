/** Info / content pages (FAQ, Werken Bij, UWV Subsidie, GGD), keyed by slug — data lives in
 *  content/<locale>/info.json (CMS + AI editable). Add a key to publish a new /<slug> info page. */
import type { InfoCollection } from '@/lib/types'

import { loadContent } from './load'

export function getInfo(locale: string): InfoCollection {
  return loadContent<InfoCollection>('info', locale)
}
export function getInfoSlugs(locale: string): string[] {
  return Object.keys(getInfo(locale))
}
