/** Treatment detail pages, keyed by slug — data lives in content/<locale>/services.json (CMS + AI
 *  editable). Add a new key (via the JSON) to publish a new /behandelingen/<slug> page. */
import type { DetailCollection } from '@/lib/types'

import { loadContent } from './load'

export function getServices(locale: string): DetailCollection {
  return loadContent<DetailCollection>('services', locale)
}
export function getServiceSlugs(locale: string): string[] {
  return Object.keys(getServices(locale))
}
