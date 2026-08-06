/** Opleidingen hub content — data lives in content/<locale>/opleidingen.json (CMS + AI editable). */
import type { HubContent } from '@/lib/types'

import { loadContent } from './load'

export function getOpleidingen(locale: string): HubContent {
  return loadContent<HubContent>('opleidingen', locale)
}
