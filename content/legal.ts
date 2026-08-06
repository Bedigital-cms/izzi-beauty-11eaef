/** Legal / plain-text pages, keyed by slug — data lives in content/<locale>/legal.json (CMS + AI
 *  editable). Add a key to publish a new /<slug> legal page. */
import type { LegalCollection } from '@/lib/types'

import { loadContent } from './load'

export function getLegal(locale: string): LegalCollection {
  return loadContent<LegalCollection>('legal', locale)
}
export function getLegalSlugs(locale: string): string[] {
  return Object.keys(getLegal(locale))
}
