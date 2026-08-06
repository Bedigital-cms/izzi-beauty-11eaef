/** Home content — data lives in content/<locale>/home.json (CMS + AI editable). */
import type { HomeContent } from '@/lib/types'

import { loadContent } from './load'

export function getHome(locale: string): HomeContent {
  return loadContent<HomeContent>('home', locale)
}
