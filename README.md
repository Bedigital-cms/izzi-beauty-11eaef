# IZZI Beauty — website template

Permanente make-up: salon (behandelingen) + academie (opleidingen). Next.js 16 (App Router), volledig
content-gedreven en i18n-ready. Eén taal actief (`nl`); extra talen zijn puur data — een nieuwe
`content/<code>/`-map plus een locale in `content/i18n.json`, geen codewijziging.

Dit template is afgeleid van een echte klantsite. Lees **[Voor een nieuwe tenant](#voor-een-nieuwe-tenant)**
vóór je het voor een andere klant inzet — de content bevat klant-eigen teksten.

## Aan de slag

```sh
pnpm install
cp .env.example .env.local     # vul MEDIA_* en NEXT_PUBLIC_FORMS_ENDPOINT in
pnpm dev                       # http://localhost:3000
pnpm typecheck && pnpm build   # allebei exit 0 — dit draait het platform ook
```

Voor formulieren in dev: draai de site op `http://<tenant-slug>.localhost:3001` (niet op `localhost`),
anders kan het CMS de tenant niet herleiden uit de Origin-host.

## Structuur

```
app/
  layout.tsx                 thin pass-through (globals.css)
  not-found.tsx              404 met eigen <html>
  globals.css                het volledige design system
  media/[filename]/route.ts  /media/<bestand> → CMS-media-endpoint
  [locale]/
    layout.tsx               <html lang dir>, fonts, hreflang
    page.tsx                 homepage
    [slug]/page.tsx          ⭐ élke detailpagina (behandeling · opleiding · locatie · blog)
    behandelingen/ · opleidingen/ · blog/ · contact/ · prijzen/ · …   hubs en vaste pagina's
    shop/ · cart/ · checkout/ · order/     webshop (optioneel — data uit het CMS, niet uit content/)
  api/commerce/*             same-origin proxy naar de CMS-webshop-API (geheime sleutel blijft hier)
components/                  Header, Footer, MobileMenu, Shell, sections.tsx, Form, Media, …
  commerce/                  AddToCart, CartView, CheckoutForm, CartBadge, CartProvider, …
content/
  i18n.json                  taal-config (1 taal actief)
  editable.json              wat het CMS mag bewerken
  forms.json                 canonieke formulierstructuur
  redirects.json             301-regels (leeg — de URL's zijn gelijk aan de oude site)
  load.ts / *.ts             taalbewuste loaders
  nl/                        site · home · services · trainings-detail · locaties · blog · shop · …
lib/                         types, i18n, locales, href
  commerce/                  config, client (gooit nooit), format, session
_import/izzi-beauty/         gemigreerde blogmedia (gitignored — zie MEDIA.md)
```

## URL's zijn vlak

Elke detailpagina staat direct onder de taal, zonder categorie-segment: `/nl/lip-blush`,
`/nl/microblading`, `/nl/amsterdam`, `/nl/wat-zijn-powder-brows`. Eén route
(`app/[locale]/[slug]/page.tsx`) zoekt de slug op in de collecties en kiest de juiste renderer.

Gevolg: **slugs moeten globaal uniek zijn** en mogen niet gelijk zijn aan een vaste routenaam. Een
build-time guard in die route faalt met een duidelijke melding bij een botsing — dat is opzet, niet een
bug. De hubs (`/behandelingen`, `/opleidingen`, `/blog`) houden hun eigen mapje.

Twee FAQ-URL's zijn bewust **genest** omdat ze de oude WordPress-structuur spiegelen. Dat is een
uitzondering, geen patroon — zie `ai-guide.md`.

## Nieuwe pagina toevoegen

Van een bestaand type: **alleen een sleutel toevoegen** aan de juiste `content/nl/*.json`
(`services.json`, `trainings-detail.json`, `locaties.json`, `blog.json` → `posts`). Er is géén nieuw
route-bestand nodig. Voeg zo nodig een kaart toe in de hub en een link in `site.json`.

Een écht nieuw paginatype: route-bestand + contentbestand + type + een regel in `editable.json`. De
volledige route-tabel staat in **`ai-guide.md`** — dat is het bestand dat de AI-agent eerst leest, dus
houd het in sync met de repo.

## Voor een nieuwe tenant

Dit template draagt content van de oorspronkelijke klant. Loop dit af bij het provisionen:

- [ ] **`content/nl/blog.json` legen.** De 50 artikelen zijn IZZI's eigen teksten, met IZZI's SEO-titels
      (`seoTitle` / `seoDescription`). Publiceren onder een ander merk levert **duplicate content** op —
      schadelijk voor beide sites. Houd één post over als voorbeeld en verwijder de rest.
- [ ] **`content/nl/site.json`** — logo, navigatie, footer, en de **echte social-URL's** (Instagram,
      Facebook, YouTube) en vestigingsadressen vervangen.
- [ ] **`content/nl/home.json`** → `contactSection`: e-mail, telefoon en locaties vervangen.
- [ ] **`content/nl/over.json`, `prijzen.json`, `info.json`, `legal.json`** — klantspecifiek; nalopen.
- [ ] **`content/forms.json`** → `notificationEmail` op het adres van de klant zetten.
- [ ] **`.env.local`** → `MEDIA_TENANT_SLUG` op de nieuwe tenant-slug; `_import/`-map meebrengen en
      importeren (zie `MEDIA.md`).
- [ ] **`content/nl/shop.json`** — alleen nodig als de tenant een webshop krijgt: hero, intro en CTA
      herschrijven. Laat `products` leeg (producten horen in het CMS). Zonder webshop hoef je niets te
      doen; het bestand blijft ongebruikt.
- [ ] **`ai-guide.md`** bijwerken als je routes of collecties toevoegt of verwijdert.

Behandelingen, opleidingen en locaties zijn generiek genoeg om als startpunt te dienen, maar loop de
teksten en prijzen na — die zijn van de oorspronkelijke klant.

## Webshop (optioneel)

Staat standaard **uit**. Een superadmin zet hem per tenant aan in het CMS (Tenants → Webshop); de
provisioning schrijft dan `NEXT_PUBLIC_COMMERCE_ENABLED=1`, `COMMERCE_API_URL` en — alleen op Vercel,
nooit in de repo — `COMMERCE_API_KEY`. Staat de vlag op `0`, dan geven `/shop`, `/cart`, `/checkout` en
`/order` een 404 en verandert er niets aan de site.

**Producten, prijzen, voorraad, bestellingen en klanten staan in de CMS-database.** In deze repo staat
daarvan niets, en dat is de kern van het ontwerp: content in git is bewerkbaar door de Content Editor en
de AI-agent, en pas na een deploy actueel — geen van beide is acceptabel voor een bedrag waarop wordt
afgerekend. De server berekent elk bedrag zelf; de browser stuurt alleen `{variantId, quantity}`.

Wat er wél in git staat is `content/<locale>/shop.json`: hero-teksten en ~60 UI-labels. De
`products`-array daarin is bewust leeg.

Drie eigenschappen die je bij wijzigingen niet mag breken:

- **Geen enkele webshop-pagina haalt op buildtijd data op.** Alles is `force-dynamic` en
  `generateStaticParams()` geeft `[]`. Het CMS bouwt deze repo vóór publiceren zonder bereikbare
  webshop-API; een fetch op buildtijd laat de publicatie van élke tenant falen. Geverifieerd: `pnpm build`
  eindigt met 0 als de API onbereikbaar is, ontbreekt of uitstaat.
- **De site blijft statisch.** De winkelwagen-badge is een client-component; zou `Header` de cookie
  lezen, dan wordt elke pagina dynamisch.
- **De geheime sleutel blijft server-side.** De browser praat met `app/api/commerce/*` op het eigen
  domein; die routes praten met het CMS. Daarom geen CORS-gedoe en geen third-party cookies.

De vijf segmenten `shop`, `cart`, `checkout`, `account` en `order` zijn **altijd** gereserveerd, ook bij
tenants zonder webshop — anders kan er een contentpagina op `/shop` staan die de webshop later in de weg
zit. Zie `ai-guide.md` voor de volledige regels.

## Media

De site slaat zelf geen bestanden op; content verwijst naar `/media/<bestand>` en het CMS levert het.
Een bestand heeft altijd **bytes én een DB-record** nodig — handmatig in de opslagmap zetten werkt niet.
Zie **`MEDIA.md`** voor de migratie en de importstap.
# izzi-beauty-template
