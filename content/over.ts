/** Over IZZI content — data lives in content/<locale>/over.json (CMS + AI editable). */
import type { OverContent } from '@/lib/types'

import { loadContent } from './load'

export function getOver(locale: string): OverContent {
  return loadContent<OverContent>('over', locale)
}
