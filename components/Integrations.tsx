/**
 * Renders the configured integrations for one injection point.
 *
 * A Server Component: the config is read at build time and the tags are baked into the HTML, so
 * there is no client bundle and no flash before a widget appears.
 *
 * `position="head"` renders inside <head> (trackers that must run early); `position="body-end"`
 * renders as the last thing in <body> (widgets — off the critical path).
 *
 * ── Why one bootstrap <script> instead of plain JSX tags ──────────────────────────────────────
 * Third-party widget snippets are a placeholder element plus a loader script, and they are order-
 * dependent: the loader must find the placeholder already in the DOM. Emitting them as JSX breaks
 * that in two ways React does not let us opt out of:
 *
 *  1. React 19 hoists <script src> into <head> and dedupes it, so the loader ends up ABOVE the
 *     placeholder it needs — the widget then silently never appears.
 *  2. Loaders own their placeholder and delete it on boot (Salonized calls `$mainElement.remove()`
 *     during init). A node React rendered but the vendor removed is a hydration mismatch, and any
 *     re-render could resurrect a placeholder the vendor already consumed.
 *
 * So we hand the browser a single inline script that writes the markup and appends the loader
 * itself, in order. React's tree then contains only this one <script>, which nothing mutates.
 *
 * On `dangerouslySetInnerHTML`: every string here is either built by lib/integrations.ts from
 * escaped settings, or a custom script a superadmin deliberately pasted. That is the feature —
 * third-party embeds are raw HTML by nature. The safety boundary is the CMS permission check on
 * who may write `customScripts`, not this component.
 */
import { getIntegrations } from '@/content/integrations'
import { tagsFor } from '@/lib/integrations'
import type { ScriptPosition } from '@/lib/types'

/** Serialize for embedding inside an inline <script> without letting the value break out of it. */
function toJs(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

export default function Integrations({ position }: { position: ScriptPosition }) {
  const tags = tagsFor(getIntegrations(), position)
  if (tags.length === 0) return null

  // Build one bootstrap program that replays the tags in their configured order.
  const steps = tags.map((tag) => {
    if (tag.kind === 'html') {
      // insertAdjacentHTML (not innerHTML on a wrapper) so the markup lands as a real sibling,
      // exactly where the vendor snippet expects it, with no extra element around it.
      return `c.insertAdjacentHTML('beforebegin',${toJs(tag.html)});`
    }
    if ('src' in tag) {
      // A script element built by hand: this is deliberately NOT a JSX <script src>, which React
      // would hoist into <head> and reorder relative to the placeholder written just above.
      const flags = [tag.async ? 's.async=!0;' : '', tag.defer ? 's.defer=!0;' : ''].join('')
      return `(function(){var s=d.createElement('script');s.src=${toJs(tag.src)};${flags}c.parentNode.insertBefore(s,c);})();`
    }
    // Inline vendor code (gtag bootstrap, fbq init) — run it directly.
    return `(function(){${tag.inline}})();`
  })

  return (
    <script
      // suppressHydrationWarning: the widgets this script injects mutate the surrounding DOM
      // (Salonized removes its placeholder), which React must not try to reconcile.
      suppressHydrationWarning
      // `c` is captured immediately: document.currentScript is only valid during initial execution
      // and reads as null inside the nested functions below.
      dangerouslySetInnerHTML={{ __html: `(function(d,c){${steps.join('')}})(document,document.currentScript);` }}
    />
  )
}
