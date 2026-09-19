import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'

/**
 * Robots policy.
 *  - PRODUCTION: allow all public pages, point at the sitemap.
 *  - PREVIEW/non-production: block indexing (noindex via disallow-all) so preview deploys never get
 *    indexed. Detected via VERCEL_ENV (production | preview | development); anything not "production"
 *    is treated as non-indexable. Private/functional routes are disallowed in every environment.
 */
const isProduction = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === 'production' : process.env.NODE_ENV === 'production'

export default function robots(): MetadataRoute.Robots {
  if (!isProduction) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Functional/private areas that must never be indexed (also mostly 404 while commerce is off).
        disallow: ['/*/preview/', '/*/account', '/*/winkelwagen', '/*/afrekenen', '/*/order/', '/api/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
