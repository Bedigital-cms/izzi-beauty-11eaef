/**
 * Integration registry — the "known providers" half of the integrations feature.
 *
 * The CMS stores only SETTINGS per provider (a Salonized company id, a GA measurement id, …);
 * the markup itself is built here. That way an editor can't paste broken or hostile markup, and a
 * fix to a vendor snippet is one template change instead of an edit on every tenant.
 *
 * Adding a provider = adding one entry to PROVIDERS. `fields` drives the CMS form, `build` turns
 * the saved settings into the tags to inject. Everything else (rendering, ordering, enable/disable)
 * is generic and needs no change.
 *
 * Server-safe: pure data + string building, no DOM and no React.
 */
import type { IntegrationProvider, IntegrationsContent, ScriptPosition } from './types'

/** One setting as the CMS should render it. `required` fields gate whether the snippet is emitted. */
export type ProviderField = {
  name: string
  label: string
  type: 'text' | 'color' | 'select'
  required?: boolean
  default?: string
  options?: { value: string; label: string }[]
  /** Shown under the input in the CMS — where to find this value in the vendor's dashboard. */
  help?: string
}

/** A tag to render. `html` is a raw element (a placeholder <div>, a floating link);
 *  `src`/`inline` describe a <script>. All three are produced by us, never by the editor. */
export type EmittedTag =
  | { kind: 'html'; html: string }
  | { kind: 'script'; src: string; async?: boolean; defer?: boolean }
  | { kind: 'script'; inline: string }

export type ProviderDef = {
  id: string
  /** Shown in the CMS integration picker. */
  label: string
  description: string
  /** Default injection point for this provider's tags. */
  position: ScriptPosition
  /** True when the provider sets cookies / tracks visitors — used to gate it behind consent
   *  once a cookie banner exists, and to warn the editor in the CMS today. */
  privacySensitive: boolean
  fields: ProviderField[]
  build: (settings: Record<string, string>) => EmittedTag[]
}

/** Escape a value for safe interpolation into an HTML attribute we generate. */
function attr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Guard against breaking out of an inline <script> we generate (`</script>`, HTML comment opener). */
function js(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

const LANGUAGES = ['nl', 'en', 'de', 'fr', 'es', 'pt', 'sk', 'no', 'lv', 'ru']

const WHATSAPP_ICON =
  '<svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">' +
  '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.83 2.41a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43-.14 0-.31-.01-.47-.01a.9.9 0 0 0-.66.31c-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29Z"/>' +
  '</svg>'

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'salonized',
    label: 'Salonized (online afspraken)',
    description:
      'Zwevende “Maak afspraak”-knop die het Salonized-boekingsscherm opent. De knop en het scherm zijn iframes van Salonized; wij plaatsen alleen de configuratie en de loader.',
    position: 'body-end',
    privacySensitive: true,
    fields: [
      {
        name: 'company',
        label: 'Company ID',
        type: 'text',
        required: true,
        help: 'Salonized → Instellingen → Online boeken → Widget. Een lange code zoals PrfWgEYr3WZagmd43yvLqWpL.',
      },
      { name: 'color', label: 'Knopkleur', type: 'color', default: '#FF6575' },
      {
        name: 'language',
        label: 'Taal',
        type: 'select',
        default: 'nl',
        options: LANGUAGES.map((l) => ({ value: l, label: l.toUpperCase() })),
      },
      {
        name: 'position',
        label: 'Positie',
        type: 'select',
        default: 'right',
        options: [
          { value: 'right', label: 'Rechtsonder' },
          { value: 'left', label: 'Linksonder' },
        ],
      },
      {
        name: 'size',
        label: 'Formaat',
        type: 'select',
        default: 'normal',
        options: [
          { value: 'normal', label: 'Normaal (zijpaneel)' },
          { value: 'full', label: 'Volledig scherm' },
        ],
      },
      {
        name: 'trackingId',
        label: 'Tracking ID (optioneel)',
        type: 'text',
        help: 'Google Analytics-ID waaraan Salonized boekingen doorgeeft. Leeg laten als je dit niet gebruikt.',
      },
    ],
    build: (s) => {
      // Salonized's loader reads these data-* attributes off the placeholder div and then injects
      // two iframes of its own (the button + the booking panel), talking to them over postMessage.
      const parts = [
        `data-company="${attr(s.company)}"`,
        `data-color="${attr(s.color || '#FF6575')}"`,
        `data-language="${attr(s.language || 'nl')}"`,
        `data-size="${attr(s.size || 'normal')}"`,
        `data-position="${attr(s.position || 'right')}"`,
      ]
      if (s.trackingId) parts.push(`data-tracking-id="${attr(s.trackingId)}"`)
      return [
        { kind: 'html', html: `<div class="salonized-booking" ${parts.join(' ')}></div>` },
        { kind: 'script', src: 'https://widget.salonized.com/loader.js', async: true },
      ]
    },
  },
  {
    id: 'google-analytics',
    label: 'Google Analytics 4',
    description: 'Bezoekersstatistieken via Google Analytics (gtag.js).',
    position: 'head',
    privacySensitive: true,
    fields: [
      {
        name: 'measurementId',
        label: 'Measurement ID',
        type: 'text',
        required: true,
        help: 'Google Analytics → Beheer → Gegevensstromen. Begint met G-.',
      },
    ],
    build: (s) => [
      {
        kind: 'script',
        src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(s.measurementId)}`,
        async: true,
      },
      {
        kind: 'script',
        inline: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config',${js(s.measurementId)});`,
      },
    ],
  },
  {
    id: 'meta-pixel',
    label: 'Meta Pixel (Facebook)',
    description: 'Meet advertentieresultaten van Facebook- en Instagram-campagnes.',
    position: 'head',
    privacySensitive: true,
    fields: [
      {
        name: 'pixelId',
        label: 'Pixel ID',
        type: 'text',
        required: true,
        help: 'Meta Events Manager → Gegevensbronnen. Een getal van ongeveer 15 cijfers.',
      },
    ],
    build: (s) => [
      {
        kind: 'script',
        inline:
          `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};` +
          `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;` +
          `s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');` +
          `fbq('init',${js(s.pixelId)});fbq('track','PageView');`,
      },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp-knop',
    description: 'Zwevende WhatsApp-knop die een chat opent met jouw zakelijke nummer. Laadt geen externe code.',
    position: 'body-end',
    // Pure link — no third-party script and no cookies, so this needs no consent gate.
    privacySensitive: false,
    fields: [
      {
        name: 'phone',
        label: 'Telefoonnummer',
        type: 'text',
        required: true,
        help: 'In internationaal formaat zonder + of spaties, bijvoorbeeld 31612345678.',
      },
      { name: 'message', label: 'Vooringevuld bericht (optioneel)', type: 'text' },
      {
        name: 'position',
        label: 'Positie',
        type: 'select',
        default: 'right',
        options: [
          { value: 'right', label: 'Rechtsonder (boven de afspraakknop)' },
          { value: 'left', label: 'Linksonder' },
        ],
        help: 'Rechts stapelt de knop boven een afspraak-widget, zoals op de meeste salonsites.',
      },
    ],
    build: (s) => {
      const digits = s.phone.replace(/[^\d]/g, '')
      if (!digits) return []
      const href = `https://wa.me/${digits}${s.message ? `?text=${encodeURIComponent(s.message)}` : ''}`
      const onLeft = s.position === 'left'
      /*
       * Afmetingen en afstanden zijn overgenomen van een live salonsite met dezelfde combinatie
       * (50px, 15px van de rand). Bewust GEEN grotere knop of media-query: de knop is op mobiel
       * even groot als op desktop — schaalt hij mee, dan legt hij het halve scherm plat.
       *
       * `bottom` staat rechts op 75px (15 + 60) zodat de knop BOVEN de zwevende afspraakknop van
       * Salonized landt in plaats van eroverheen; links is die ruimte niet nodig.
       */
      const side = onLeft ? 'left:15px' : 'right:15px'
      const bottom = onLeft ? 'bottom:15px' : 'bottom:75px'
      // Inline styles on purpose: the button must sit correctly without depending on the tenant's CSS.
      return [
        {
          kind: 'html',
          html:
            `<a href="${attr(href)}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" ` +
            `style="position:fixed;${side};${bottom};z-index:2147483000;display:flex;align-items:center;` +
            `justify-content:center;width:50px;height:50px;border-radius:9999px;background:#25D366;` +
            `box-shadow:0 2px 8px rgba(0,0,0,.2)">${WHATSAPP_ICON}</a>`,
        },
      ]
    },
  },
]

export function getProvider(id: string): ProviderDef | undefined {
  return PROVIDERS.find((p) => p.id === id)
}

/** A provider instance is renderable only when it's enabled, known, and has every required field. */
function isRenderable(instance: IntegrationProvider, def: ProviderDef): boolean {
  if (!instance.enabled) return false
  return def.fields.every((f) => !f.required || Boolean(instance.settings?.[f.name]?.trim()))
}

/** Resolve the config into the tags to inject at one position. Unknown ids and half-configured
 *  providers are skipped silently — a missing widget must never break the page. */
export function tagsFor(config: IntegrationsContent, position: ScriptPosition): EmittedTag[] {
  const tags: EmittedTag[] = []

  for (const instance of config.providers ?? []) {
    const def = getProvider(instance.id)
    if (!def || def.position !== position || !isRenderable(instance, def)) continue
    try {
      tags.push(...def.build(instance.settings ?? {}))
    } catch {
      // A malformed setting must not take the whole build down over one widget.
    }
  }

  for (const script of config.customScripts ?? []) {
    if (!script.enabled || script.position !== position || !script.code?.trim()) continue
    tags.push({ kind: 'html', html: script.code })
  }

  return tags
}
