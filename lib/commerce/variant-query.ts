/**
 * Deeplink van een opleidingsdatum naar de productpagina.
 *
 * De query bevat ALLEEN het variant-id. Prijs en voorraad komen altijd opnieuw uit het CMS —
 * nooit uit de URL.
 */
export const VARIANT_QUERY = 'variant'

export function productVariantHref(handle: string, variantId: string | number): string {
  return `/product/${handle}?${VARIANT_QUERY}=${encodeURIComponent(String(variantId))}`
}

/** Eerste querywaarde, ook als Next een string[] doorgeeft. Leeg → null. */
export function firstQueryValue(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value
  const trimmed = (raw ?? '').trim()
  return trimmed || null
}

/**
 * Kies een variant uit de URL alleen als hij bestaat én inStock is. Ongeldig of uitverkocht →
 * null, zodat de normale kiezer blijft staan. Geen throw.
 */
export function pickInStockVariantId(
  variants: Array<{ id: string | number; inStock: boolean }>,
  requested?: string | null,
): string | null {
  const wanted = (requested ?? '').trim()
  if (!wanted) return null
  const match = variants.find((v) => String(v.id) === wanted)
  return match?.inStock ? String(match.id) : null
}

function optionValue(
  options: Array<{ name: string; value: string }>,
  names: string[],
): string {
  const want = new Set(names.map((n) => n.toLowerCase()))
  return options.find((o) => want.has(o.name.trim().toLowerCase()))?.value?.trim() ?? ''
}

/** Datum/locatie uit CMS-opties; onbekende namen → lege strings (caller valt terug). */
export function trainingOptionValues(options: Array<{ name: string; value: string }>): {
  date: string
  location: string
} {
  return {
    date: optionValue(options, ['datum', 'date']),
    location: optionValue(options, ['locatie', 'location']),
  }
}
