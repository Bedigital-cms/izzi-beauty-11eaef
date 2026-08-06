/** SEO location pages, keyed by city slug — data lives in content/<locale>/locaties.json (CMS + AI
 *  editable). Add a key (e.g. "rotterdam") to publish /wenkbrauwen/<stad>. The footer links to these. */
import type { LocationPageCollection } from '@/lib/types'

import { loadContent } from './load'

export function getLocaties(locale: string): LocationPageCollection {
  return loadContent<LocationPageCollection>('locaties', locale)
}
export function getLocatieSlugs(locale: string): string[] {
  return Object.keys(getLocaties(locale))
}
