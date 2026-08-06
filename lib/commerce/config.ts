/**
 * Webshop-configuratie van deze site.
 *
 * PUUR env-gebaseerd: geen fs, geen netwerk, geen await. Daarom veilig te importeren vanuit élke
 * plek — ook uit `app/[locale]/[slug]/page.tsx`, waar de flat-slug-guard bij het BOUWEN draait.
 * Een fout hier breekt de build van élke tenant, dus deze module doet zo weinig mogelijk.
 *
 * De vlag komt van provisioning (`NEXT_PUBLIC_COMMERCE_ENABLED`), niet uit `content/`. Reden: het is
 * een instelling van de Super Admin, en content-bestanden zijn bewerkbaar door de Content Editor en
 * de AI-agent. Dat is de verkeerde vertrouwensgrens voor een schakelaar die de webshop aanzet.
 */

/** Staat de webshop aan voor deze site? */
export const commerceEnabled = (): boolean => process.env.NEXT_PUBLIC_COMMERCE_ENABLED === '1'

/**
 * Padsegmenten die de webshop opeist.
 *
 * ⚠️ Geeft ALTIJD de volledige lijst terug, óók als de webshop uit staat.
 *
 * Waarom: `app/[locale]/[slug]/page.tsx` gebruikt deze lijst om te controleren dat een content-slug
 * niet botst met een vaste route. Zou de lijst leeg zijn bij een uitgeschakelde webshop, dan kan een
 * redacteur een pagina op `/winkel` aanmaken, waarna het aanzetten van de webshop die pagina
 * onbereikbaar maakt — of de build laat falen. Zeven namen reserveren is een kleine prijs voor die
 * zekerheid.
 *
 * ⚠️ Deze lijst MOET meebewegen met de mapnamen onder `app/[locale]/`. Staat er een route die hier
 * ontbreekt, dan mag een redacteur een pagina met die slug aanmaken en is één van de twee
 * onbereikbaar — een botsing die geen enkele build laat zien, omdat de ene kant uit de database komt.
 *
 * De namen zijn Nederlands omdat de URL's van deze winkel dat zijn (/winkel, /product/<slug>,
 * /product-categorie/<slug>, /winkelwagen, /afrekenen). `account` en `order` staan er nog niet als
 * pagina, maar zijn wel gereserveerd.
 */
export const commerceRouteSegments = (): string[] => [
  'winkel',
  'product',
  'product-categorie',
  'winkelwagen',
  'afrekenen',
  'account',
  'order',
]

/** Basis-URL van de webshop-API. Alleen server-side beschikbaar. */
export const commerceApiUrl = (): string => (process.env.COMMERCE_API_URL || '').replace(/\/+$/, '')

/**
 * De geheime storefront-sleutel. **Alleen server-side.**
 *
 * Geen `NEXT_PUBLIC_`-prefix, dus Next vervangt dit in clientcode door `undefined` — een fout die
 * meteen opvalt, in plaats van een sleutel die stilletjes in de browserbundel belandt.
 */
export const commerceApiKey = (): string => process.env.COMMERCE_API_KEY || ''

/** Is de webshop volledig bruikbaar (aan én geconfigureerd)? */
export const commerceReady = (): boolean =>
  commerceEnabled() && commerceApiUrl() !== '' && commerceApiKey() !== ''
