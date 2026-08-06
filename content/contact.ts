/** Contact content — data lives in content/<locale>/contact.json (CMS + AI editable). */
import type { ContactContent } from '@/lib/types'

import { loadContent } from './load'

export function getContact(locale: string): ContactContent {
  return loadContent<ContactContent>('contact', locale)
}
