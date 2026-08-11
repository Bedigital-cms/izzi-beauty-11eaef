/** External integrations (booking widgets, trackers) — data lives in the language-neutral
 *  content/integrations.json, managed by the BE Digital CMS (Tenants → Integraties).
 *  Language-neutral like commerce.json/redirects.json: one config for every locale. */
import { readFileSync } from 'node:fs'
import path from 'node:path'

import type { IntegrationsContent } from '@/lib/types'

const EMPTY: IntegrationsContent = { providers: [], customScripts: [] }

/** Read content/integrations.json. A missing or malformed file is not an error: the site simply
 *  renders without integrations, which is the correct behaviour for a tenant that has none. */
export function getIntegrations(): IntegrationsContent {
  try {
    const raw = JSON.parse(readFileSync(path.join(process.cwd(), 'content', 'integrations.json'), 'utf8'))
    return {
      providers: Array.isArray(raw?.providers) ? raw.providers : [],
      customScripts: Array.isArray(raw?.customScripts) ? raw.customScripts : [],
    }
  } catch {
    return EMPTY
  }
}
