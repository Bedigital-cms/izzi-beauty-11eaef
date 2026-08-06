/** Prijzen content — data lives in content/<locale>/prijzen.json (CMS + AI editable). */
import type { PrijzenContent } from '@/lib/types'

import { loadContent } from './load'

export function getPrijzen(locale: string): PrijzenContent {
  return loadContent<PrijzenContent>('prijzen', locale)
}
