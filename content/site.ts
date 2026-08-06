/** Site-wide content (brand, mega-menu nav, footer, locations) — data lives in
 *  content/<locale>/site.json (editable by the CMS Content Editor + the AI agent). */
import type { SiteContent } from '@/lib/types'

import { loadContent } from './load'

export function getSite(locale: string): SiteContent {
  return loadContent<{ site: SiteContent }>('site', locale).site
}
