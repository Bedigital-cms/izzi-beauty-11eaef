/**
 * iDEAL in3 — mag deze bestelling gespreid betaald worden?
 *
 * ── Waarom dit óók op de site staat en niet alleen in het CMS ─────────────────────────────────
 * Het CMS controleert dit al vlak voordat de betaling naar Mollie gaat: valt het bedrag buiten de
 * grenzen, dan vraagt het in3 niet aan en krijgt de klant het gewone betaalmenu. Dat voorkomt een
 * kapotte betaalpagina, maar het gebeurt pas ná het afrekenen — de klant heeft dan al gekozen.
 *
 * Deze functie doet dezelfde controle een stap eerder, op het scherm waar de keuze wordt gemaakt.
 * Zonder die controle zet de site een knop "gespreid betalen" neer die Mollie stilzwijgend uit het
 * menu haalt: de cursist kiest hem, komt op de betaalpagina, en de optie is er niet. Geen fout,
 * geen uitleg. Juist bij de dure opleidingen — All Round PMU staat op € 9.900 en zit daarmee ruim
 * boven het gebruikelijke plafond van € 5.000 — is dat de klant die gespreid betalen het hardst
 * nodig heeft.
 *
 * ── Eén regel, twee plekken ───────────────────────────────────────────────────────────────────
 * De grenzen komen uit het CMS (`/config` → `in3`), niet uit deze code. Mollie spreekt ze per
 * merchant af, dus ze verschillen per klant en kunnen wijzigen zonder deploy. Deze functie is
 * bewust een kopie van `in3Allowed()` in het CMS (`modules/commerce/payments/mollie.ts`): zelfde
 * vergelijking, zelfde inclusieve grenzen. Zou de site ruimer oordelen dan de server, dan is het
 * resultaat precies de stille verdwijning die hierboven beschreven staat.
 */

/** De in3-grenzen zoals `/config` ze teruggeeft. `null` = in3 staat uit voor deze webshop. */
export type In3Limits = { minCents: number; maxCents: number } | null

/**
 * Valt dit bedrag binnen de in3-grenzen?
 *
 * Grenzen zijn INCLUSIEF, gelijk aan de CMS-kant. Staat in3 uit (`null`), dan altijd `false`.
 */
export function in3Allowed(limits: In3Limits, amountCents: number): boolean {
  if (!limits) return false
  return amountCents >= limits.minCents && amountCents <= limits.maxCents
}

/**
 * Waarom is in3 niet beschikbaar voor dit bedrag? `null` als het wél mag.
 *
 * Geeft een reden die de bezoeker iets vertelt in plaats van een optie die er zomaar niet is. Het
 * bedrag wordt hier niet geformatteerd — dat doet de aanroeper met `money()`, zodat er één plek is
 * waar valuta-opmaak vandaan komt.
 */
export function in3UnavailableReason(
  limits: In3Limits,
  amountCents: number,
): 'disabled' | 'below-min' | 'above-max' | null {
  if (!limits) return 'disabled'
  if (amountCents < limits.minCents) return 'below-min'
  if (amountCents > limits.maxCents) return 'above-max'
  return null
}
