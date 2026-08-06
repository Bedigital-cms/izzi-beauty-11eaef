/** Portfolio content — data lives in content/<locale>/portfolio.json (CMS + AI editable). Images may
 *  be empty strings; the gallery renders a blank placeholder tile until a client uploads photos. */
import type { PortfolioContent } from '@/lib/types'

import { loadContent } from './load'

export function getPortfolio(locale: string): PortfolioContent {
  return loadContent<PortfolioContent>('portfolio', locale)
}
