/** Behandelingen hub content — data lives in content/<locale>/behandelingen.json (CMS + AI editable). */
import type { HubContent } from '@/lib/types'

import { loadContent } from './load'

export function getBehandelingen(locale: string): HubContent {
  return loadContent<HubContent>('behandelingen', locale)
}
