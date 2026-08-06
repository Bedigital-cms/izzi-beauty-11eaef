/** Training detail pages, keyed by slug — data lives in content/<locale>/trainings-detail.json
 *  (CMS + AI editable). Add a new key (via the JSON) to publish a new /opleidingen/<slug> page. */
import type { DetailCollection } from '@/lib/types'

import { loadContent } from './load'

export function getTrainingsDetail(locale: string): DetailCollection {
  return loadContent<DetailCollection>('trainings-detail', locale)
}
export function getTrainingSlugs(locale: string): string[] {
  return Object.keys(getTrainingsDetail(locale))
}
