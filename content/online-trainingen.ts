/** Online trainingen hub content — data lives in content/<locale>/online-trainingen.json (CMS + AI editable). */
import type { HubContent } from '@/lib/types'

import { loadContent } from './load'

export function getOnlineTrainingen(locale: string): HubContent {
  return loadContent<HubContent>('online-trainingen', locale)
}
