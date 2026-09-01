# AI-guide — IZZI Beauty template

> ⚠️ Dit bestand is SPECIFIEK voor het izzi-beauty template (Nederlandstalig). **Bij het kopiëren naar
> een nieuw template moet je de volledige routes-tabel, de collectie-lijst én de types hieronder
> vervangen** door die van het nieuwe template — anders zoekt de agent naar niet-bestaande routes.

Dit bestand beschrijft de structuur van **deze** website (het izzi-beauty template) voor de
AI Website-agent. Lees dit eerst. Het is leidend voor routes, content-bestanden en hoe je een
nieuwe pagina toevoegt. Structuur bewerk je door de juiste `content/<locale>/*.json` te editen —
niet door nieuwe route-bestanden te maken (behalve bij een écht nieuw paginatype).

> Kernregel: tekst/data staat in `content/<locale>/*.json`; layout/componenten in `components/*.tsx` +
> `app/[locale]/**`. Bij alleen tekst/beeld wijzigen → alleen de JSON editen. Beeldpaden leeg (`""`)
> laten tenzij er een echt geüpload `/media/...` pad is (leeg → nette placeholder via `<Media>`).

## 🔗 VLAKKE URLs — LEES DIT EERST

Deze site gebruikt **vlakke URLs**: elke detailpagina staat DIRECT onder de taal, ZONDER
categorie-segment. Dus `/lip-blush` (niet `/behandelingen/lip-blush`), `/microblading` (niet
`/opleidingen/microblading`), `/amsterdam` (niet `/wenkbrauwen/amsterdam`), `/mijn-artikel` (niet
`/blog/mijn-artikel`).

- **Eén dynamische route** rendert alle detailpagina's: `app/[locale]/[slug]/page.tsx`. Die zoekt de
  slug op in de collecties (services → trainings → locaties → blog) en rendert de juiste renderer.
  **Maak nooit een nieuw route-bestand voor een detailpagina** — voeg alleen een key toe aan de JSON.
- **De hub/overzicht-pagina's houden hun eigen pad:** `/behandelingen`, `/opleidingen`, `/blog`
  (lijstpagina's met eigen mapje). Alleen de DETAILpagina's zijn vlak.
- **⭐ SLUGS MOETEN GLOBAAL UNIEK ZIJN.** Omdat alles onder één vlakke namespace valt, mag dezelfde
  slug niet in twee collecties voorkomen (bv. een behandeling én een opleiding `lip-blush`), en mag
  een slug niet gelijk zijn aan een vaste routenaam (`behandelingen`, `opleidingen`, `blog`,
  `kennisbank`, `contact`, `prijzen`, `over-izzi`, `portfolio`, `ons-team`, `werkwijze`,
  `onze-locaties`, `videos`, `preview`, en de webshop-namen `winkel`, `winkelwagen`, `afrekenen`,
  `account`, `order`, `product`, `product-categorie` — die laatste zijn ALTIJD bezet, ook bij
  tenants zonder webshop). Een
  build-time guard in `[slug]/page.tsx` faalt
  met een duidelijke melding als er een botsing is — hernoem er dan één (en zet een redirect van de
  oude URL). Verzin bij twijfel een onderscheidende slug (bv. een opleiding → `lip-blush-opleiding`).
- **Redirects:** `content/redirects.json` bevat **30 regels**: de stadspagina's staan op een korte
  slug (`/haarlem`), terwijl de oude WordPress-site keyword-slugs gebruikte
  (`/wenkbrauwen-haarlem`, `/permanente-make-up-almere`). Zonder die 301's gaf elke bestaande
  Google-positie een 404. Voeg hier alleen een regel toe als een URL écht verandert én de oude
  variant nog verkeer krijgt.

### ⚠️ Uitzondering: twee GENESTE FAQ-URLs (spiegel van de oude site)

Twee menulinks staan bewust NIET vlak: ze volgen exact de URL-structuur van de oorspronkelijke
WordPress-site (`izzi-beauty.com`), omdat die URLs daar al ranken. Dit zijn de **enige** URLs van die
pagina's — er is geen vlakke variant en er is **geen redirect** (bewuste keuze van de klant):

| Publieke URL (prefix-vrij) | Route-bestand | `info.json`-key |
|---|---|---|
| `/pmu-opleiding-lippen/veelgesteldevragen-lippen` | `app/[locale]/pmu-opleiding-lippen/veelgesteldevragen-lippen/page.tsx` | `veelgesteldevragen-lippen` |
| `/online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen` | `app/[locale]/online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen/page.tsx` | `online-trainingen-veelgestelde-vragen` |

Regels hierbij:

- De **oudergedeelten bestaan niet als pagina**: `/pmu-opleiding-lippen` en
  `/online-trainingen-veelgestelde-vragen` hebben géén `page.tsx` en geven dus 404. Dat is bewust —
  niets linkt ernaar. Maak ze alleen aan als de klant erom vraagt.
- Nav-URLs in `site.json` mogen dus **meerdere segmenten** hebben. Kopieer het pad exact zoals het in
  de tabel staat (prefix-vrij, zonder `/nl`); `<LocaleLink>` zet de taalprefix ervoor.
- Elk **nieuw eerste segment** van zo'n genest pad moet in de `RESERVED`-set in
  `app/[locale]/[slug]/page.tsx` — anders kan een collectie-slug ermee botsen en wordt de verkeerde
  pagina geserveerd. (`pmu-opleiding-lippen` en `online-trainingen-veelgestelde-vragen` staan er al in.)
- **Dit is een uitzondering, geen nieuw patroon.** Nest alleen als de klant een specifieke oude URL
  wil spiegelen; alle overige detailpagina's blijven vlak (`/<slug>`).

## 🛒 WEBSHOP — PRODUCTEN STAAN NIET IN GIT

> **Kernregel: je maakt NOOIT productgegevens aan in een JSON-bestand.** Producten, prijzen, voorraad,
> varianten, categorieën, bestellingen en klanten staan in de **CMS-database** en worden bij elk bezoek
> live opgehaald. In deze repo staat daarvan **niets** — en dat moet zo blijven.

**Waarom dit een harde regel is en geen voorkeur.** De content in deze repo is bewerkbaar door de
Content Editor én door jou, en wordt op buildtijd ingebakken. Een prijs die in git staat is daarmee een
prijs die iedereen met repo-toegang kan wijzigen, die pas na een deploy klopt, en waar geen enkele
server-side controle op zit. Dan kan een bezoeker afrekenen tegen een bedrag dat de klant nooit heeft
bedoeld. Voorraad is hetzelfde probleem: twee gelijktijdige bestellingen zouden beide slagen. Daarom
kent de server maar één bron van waarheid voor geld en voorraad, en dat is de database.

**Wat je dus NIET doet — ook niet als de klant het letterlijk vraagt:**

| ❌ Niet doen | ✅ In plaats daarvan |
|---|---|
| Een `products`-array met `price`/`stock` in een JSON-bestand zetten | Uitleggen dat producten in het CMS worden beheerd onder **Webshop → Producten** |
| Producten toevoegen aan `content/<locale>/shop.json` | Alleen de kop- en labelteksten daar aanpassen (zie hieronder) |
| Een eigen `/producten`- of `/webshop`-route maken | De bestaande `/winkel`-routes gebruiken; die zijn er al |
| Prijzen in `services`/`trainings` gebruiken als productprijs | Die prijzen zijn behandelprijzen (tekst), geen afrekenbare bedragen |
| `lib/commerce/*` of `app/api/commerce/*` aanpassen | Afblijven — dat is de beveiligde laag naar het CMS |

Ziet een verzoek eruit als "voeg product X toe voor €29,95"? Dan is dat werk voor het CMS, niet voor
jou. Zeg dat, en verwijs naar Webshop → Producten. Maak niets aan.

**Wat je WEL mag doen:**

- `content/<locale>/shop.json` — hero-teksten, intro, de CTA-band en de ~60 UI-labels (`ui.*`:
  knopteksten, foutmeldingen, veldlabels van het afrekenen). Puur tekst. De `products`-array daarin is
  bewust **leeg** en moet leeg blijven; hij staat er alleen zodat het type klopt.
- `sidebarWidgets` in `shop.json` — de blokken onder de categorielijst in de zijbalk van de winkel
  (titel, tekst, een afbeeldingspad in `/media`, een link). Alleen redactioneel; **nooit** producten of
  prijzen. Een lege lijst betekent: alleen de categorieën.
- Nav-links naar `/winkel` in `site.json` toevoegen of weghalen.
- De commerce-CSS in `app/globals.css` (één gemarkeerd blok onderaan) bijschaven.

**Structuur, voor als je iets moet nazoeken:**

| Pad | Wat |
|---|---|
| `app/[locale]/winkel/page.tsx` | Winkelingang: **categorietegels** + zijbalk. Valt terug op een productrooster als de webshop nog geen categorieën heeft |
| `app/[locale]/product-categorie/[slug]/page.tsx` | De producten van één categorie (sorteren/pagineren) |
| `app/[locale]/product/[handle]/page.tsx` | Productdetail |
| `components/commerce/ShopSidebar.tsx` | Categorielijst + redactionele blokken (`sidebarWidgets` uit `shop.json`) |
| `app/[locale]/winkelwagen`, `afrekenen`, `afrekenen/bedankt` | Winkelwagen en afrekenen |
| `app/[locale]/order/[orderNumber]` | Bestelling volgen (gast) |
| `app/api/commerce/*` | Proxy naar het CMS. De browser praat **nooit** direct met het CMS: de geheime sleutel blijft server-side. |
| `lib/commerce/client.ts` | Alle API-aanroepen. **Gooit nooit** — geeft `{ok:false,error}` terug. |
| `components/commerce/*` | `AddToCart`, `CartView`, `CheckoutForm`, `CartBadge`, `AuthForm`, `AddressBook`, `OrderHistory`, `OrderFilters`, … |
| `app/[locale]/account/*` | Klantaccount: inloggen/registreren met een code, bestel- en betaalgeschiedenis met factuur-PDF, adresboek, gegevens (wijzigen gaat óók via een code) |

**Twee dingen die stil kapot gaan als je ze negeert:**

1. **Nooit data ophalen op buildtijd in een commerce-route.** Alle webshop-pagina's hebben
   `export const dynamic = 'force-dynamic'` en een `generateStaticParams()` die `[]` teruggeeft. Het CMS
   doet vóór publiceren een validatie-build zonder bereikbare webshop-API; haalt een pagina daar data
   op, dan faalt de publicatie van **élke** tenant, ook die zonder webshop. Laat dat staan.
2. **Nooit de winkelwagen-cookie lezen in `Header`, `Footer` of een serverpagina.** `cookies()` maakt de
   hele pagina dynamisch en dan is de site niet meer statisch. De badge is met opzet een client-component
   die na hydratie zelf zijn aantal ophaalt.

**Webshop uit?** `NEXT_PUBLIC_COMMERCE_ENABLED` staat dan op `0` en `/winkel`, `/winkelwagen`, `/afrekenen` en
`/order` geven 404. De bestandsstructuur blijft wel staan (die hoort bij het template) — verwijder de
routes niet. De vijf segmenten blijven ook dan gereserveerd, zodat er nooit een contentpagina op `/shop`
staat die later de webshop in de weg zit.

## 🌐 Meertalig (i18n)

Deze site is **i18n-ready**. Houd je hieraan:

- **Content staat per taal in `content/<locale>/`** — bv. `content/nl/home.json`. Er is GEEN plat
  `content/home.json`. De standaardtaal is **`nl`** (zie `content/i18n.json`). Maak nooit een plat
  `content/<bestand>.json` aan — `content/load.ts` leest enkel `content/<locale>/<naam>.json`.
- **Routes staan onder `app/[locale]/`.** In de routes-tabel hieronder staan de **publieke URLs
  zonder taalprefix** (`/lip-blush`); de site serveert ze onder `/nl/lip-blush` (de `[locale]`-prefix
  wordt automatisch toegevoegd).
- **Links in content zijn prefix-vrij én vlak** (`/contact`, `/lip-blush`). De taalprefix wordt bij
  het renderen toegevoegd (`<LocaleLink>`). Zet dus NOOIT `/nl/...` of een categorie-segment in
  content-JSON.
- **Nieuwe taal toevoegen = data, geen code** (tenant-toggle schrijft `content/i18n.json`; content
  wordt per taal gekopieerd/vertaald naar `content/<code>/`).
- **Systeembestanden staan plat in `content/` (taal-neutraal):** `content/i18n.json`,
  `content/forms.json`, `content/redirects.json`, `content/editable.json`. Niet in taalmappen zetten.

## Routes → content-bestand

> URLs hieronder zijn prefix-vrij; de echte URL is `/<locale>/<pad>`. Detailpagina's zijn VLAK
> (`/<slug>`), gerenderd door de ene route `app/[locale]/[slug]/page.tsx`.

| Route (publiek, prefix-vrij) | Type | Content-bestand | Renderer |
|---|---|---|---|
| `/` | homepage | `content/<locale>/home.json` | `app/[locale]/page.tsx` (eigen secties) |
| — | site (logo/nav/footer/locaties) | `content/<locale>/site.json` | `Header.tsx` / `Footer.tsx` |
| `/behandelingen` | hub/overzicht | `content/<locale>/behandelingen.json` | `app/[locale]/behandelingen/page.tsx` → `HubPage` |
| `/<slug>` | behandeling-detail (collectie) | `content/<locale>/services.json` | `app/[locale]/[slug]` → `DetailPage` |
| `/opleidingen` | hub/overzicht | `content/<locale>/opleidingen.json` | `app/[locale]/opleidingen/page.tsx` → `HubPage` |
| `/<slug>` | opleiding-detail (collectie) | `content/<locale>/trainings-detail.json` | `app/[locale]/[slug]` → `DetailPage` |
| `/online-trainingen` | hub/overzicht | `content/<locale>/online-trainingen.json` | `HubPage` |
| `/<slug>` | SEO-locatie/stad (collectie) | `content/<locale>/locaties.json` | `app/[locale]/[slug]` → `LocationPage` |
| `/blog` | index, pagina 1 | `content/<locale>/blog.json` (`index`) | `app/[locale]/blog/page.tsx` |
| `/kennisbank` | kennisbank: artikelen per onderwerp | `content/<locale>/blog.json` | `app/[locale]/kennisbank/page.tsx` |
| `/kennisbank/<categorie>` | één onderwerp | idem, gefilterd op `category` | `app/[locale]/kennisbank/[category]/page.tsx` |
| `/preview/<slug>` | voorbeeld van een artikel, **ook een concept** | `content/<locale>/blog.json` (`posts`) | `app/[locale]/preview/[slug]/page.tsx` |
| `/ons-team` | teampagina | `content/<locale>/info.json` (`ons-team`) | `InfoPage` |
| `/werkwijze` | werkwijze | `content/<locale>/info.json` (`werkwijze`) | `InfoPage` |
| `/videos` | video's | `content/<locale>/info.json` (`videos`) | `InfoPage` |
| `/onze-locaties` | salons + verzorgingsgebied | `site.json` + `locaties.json` | `app/[locale]/onze-locaties/page.tsx` → `HubPage` |
| `/blog/page/<n>` | index, pagina 2+ | idem | `app/[locale]/blog/page/[page]/page.tsx` |
| `/<slug>` | blog-artikel (collectie) | `content/<locale>/blog.json` (`posts`) | `app/[locale]/[slug]` |
| `/prijzen` | prijzen | `content/<locale>/prijzen.json` | `PriceList` |
| `/over-izzi` | over | `content/<locale>/over.json` | `app/[locale]/over-izzi/page.tsx` |
| `/portfolio` | galerij | `content/<locale>/portfolio.json` | `Gallery` |
| `/contact` | contact + formulier | `content/<locale>/contact.json` + `forms.json` | `app/[locale]/contact/page.tsx` |
| `/veelgestelde-vragen`, `/werken-bij-izzi-beauty`, `/uwv-subsidie`, `/ggd-gecertificeerd`, `/permanente-make-up-lippen-veelgestelde-vragen`, `/permanente-make-up-sproetjes-veelgestelde-vragen`, `/permanente-make-up-eyeliner-veelgestelde-vragen` | info (collectie) | `content/<locale>/info.json` | eigen routes → `InfoPage` |
| `/pmu-opleiding-lippen/veelgesteldevragen-lippen`, `/online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen` | info (collectie), **genest** — zie de uitzondering hierboven | `content/<locale>/info.json` | eigen geneste routes → `InfoPage` |
| `/algemene-voorwaarden`, `/privacy-verklaring`, `/opleidingen-voorwaarden` | juridisch (collectie) | `content/<locale>/legal.json` | eigen routes → `LegalPage` |
| `/winkel` | winkelingang: categorietegels | **CMS-database** (alleen teksten uit `shop.json`) | `app/[locale]/winkel/page.tsx` |
| `/product-categorie/<slug>` | producten van één categorie | **CMS-database** | `app/[locale]/product-categorie/[slug]/page.tsx` |
| `/product/<handle>` | productdetail | **CMS-database** | `app/[locale]/product/[handle]/page.tsx` |
| `/winkelwagen`, `/afrekenen`, `/afrekenen/bedankt` | winkelwagen + afrekenen | **CMS-database** (labels uit `shop.json`) | `app/[locale]/winkelwagen|afrekenen/…` |
| `/order/<bestelnummer>` | bestelling volgen | **CMS-database** | `app/[locale]/order/[orderNumber]/page.tsx` |
| `/account`, `/account/bestellingen`, `/account/adressen`, `/account/gegevens` | klantaccount: bestel- en betaalgeschiedenis (met factuur-PDF en filters), adresboek, gegevens | **CMS-database** (labels uit `shop.json`) | `app/[locale]/account/…` |
| `/account/inloggen`, `/account/registreren`, `/account/wachtwoord-vergeten`, `/account/nieuw-wachtwoord` | inloggen, registreren en herstellen — met een code van 6 cijfers per e-mail | **CMS-database** | `app/[locale]/account/…` |

> ⚠️ De laatste zeven regels zijn **webshop**-routes: die halen hun data live uit het CMS, niet uit
> `content/`. Zie het webshop-hoofdstuk hierboven — maak daar nooit productgegevens voor aan.
>
> `categorie` is een vast tussensegment, geen productslug. Zonder dat segment zouden een categorie en
> een product met dezelfde slug in dezelfde namespace botsen — en omdat beide uit de database komen,
> zou geen enkele build die botsing kunnen opmerken.

> Behandeling-, opleiding-, locatie- en blogdetails delen ALLEMAAL de ene route `app/[locale]/[slug]`.
> `[slug]/page.tsx` beslist per slug welke renderer draait. Vaste pagina's (prijzen, contact, de
> hubs, …) houden hun eigen mapje en winnen altijd van de dynamische `[slug]`.

> **Blog-paginering.** De index toont `POSTS_PER_PAGE` (12) artikelen per pagina, nieuwste eerst;
> die constante staat in `components/sections.tsx` en bepaalt meteen hoeveel `/blog/page/<n>`-routes
> `generateStaticParams` prerendert. Pagina 1 is altijd `/blog` — `/blog/page/1` redirect daarheen,
> zodat de eerste pagina één canonieke URL houdt. Een `<n>` buiten bereik geeft een 404.

## Content laden (loaders)

Content wordt NIET statisch geïmporteerd. Elke `content/<naam>.ts` exporteert een functie die de
taal meekrijgt en via `content/load.ts` het juiste bestand leest:
`getHome(locale)`, `getSite(locale)`, `getServices(locale)` + `getServiceSlugs(locale)`, enz.
De vlakke route `app/[locale]/[slug]/page.tsx` haalt `locale`+`slug` uit `params`, zoekt de slug op
en rendert de juiste renderer. `generateStaticParams` bundelt alle slugs van alle collecties per taal
en werpt bij een dubbele/gereserveerde slug een build-fout (de uniciteitsguard).

## Keyed collections (⭐ zo voeg je pagina's toe zónder nieuwe route)

Deze bestanden zijn `{ "<slug>": {…} }` (per taal). Een nieuwe key = een nieuwe pagina op `/<slug>`.
**Maak GEEN nieuw route-bestand** — de vlakke `[slug]`-route rendert elke key automatisch. Kopieer de
vorm van een bestaande entry. Voeg de key toe in **elke actieve taal** (`content/<locale>/…`), of
minstens in de standaardtaal (`content/nl/…`). ⭐ Kies een slug die nog NERGENS bestaat (uniek over
alle collecties + geen vaste routenaam) — anders faalt de build-guard.

- `content/<locale>/services.json` → `/<slug>` (type `DetailContent`). Voeg ook een kaart toe in
  `content/<locale>/behandelingen.json` (een `groups[].items` met `url: "/<slug>"` — prefix-vrij én
  vlak) en, indien in het menu, een link in `content/<locale>/site.json` (`nav[].columns[].links`).
- `content/<locale>/trainings-detail.json` → `/<slug>` (type `DetailContent`). Kaart in
  `content/<locale>/opleidingen.json`, evt. nav in `site.json`.
- `content/<locale>/locaties.json` → `/<slug>` (type `LocationPageContent`). Voeg de stad toe aan de
  footerkolom in `site.json` indien gewenst.
- `content/<locale>/blog.json` → posts onder de key `posts` (`{ "posts": { "<slug>": {…} } }`, type
  `BlogPost`). De blogindex (`/blog`) toont ze automatisch en linkt naar `/<slug>` — geen kaart nodig.
  De collectie bevat **alle 50 artikelen van de oorspronkelijke WordPress-site** (`izzi-beauty.com`),
  gemigreerd met dezelfde slugs zodat de bestaande URLs blijven werken (`/nl/<slug>`, vroeger
  `izzi-beauty.com/nl/<slug>/`). De posts staan gesorteerd op `date`, nieuwste eerst.
  Elke post heeft ook **`seoTitle` + `seoDescription`**, letterlijk overgenomen van de oorspronkelijke
  WordPress-post; `generateMetadata` in `app/[locale]/[slug]/page.tsx` gebruikt die (en valt terug op
  `title`/`excerpt`). ⚠️ Zet er dus **geen merknaam achter** — `seoTitle` is al een volledige titel.
  De `image`-velden verwijzen naar de **gemigreerde featured images** (`/media/<naam>-<hash>.<ext>`);
  zie `MEDIA.md` voor de import. 14 posts delen dezelfde generieke afbeelding omdat ze die op de oude
  site óók deelden — dat is geen bug. ⚠️ **Eén slug is bewust hernoemd:** het WordPress-artikel
  `/allround-pmu-opleiding` botste met de opleiding-detailpagina met diezelfde slug in
  `trainings-detail.json`, dus de blogpost heet hier `allround-pmu-opleiding-blog`. Die URL stond op de
  oude site in zowel de page- als de post-sitemap (één URL), en wordt hier door de opleidingspagina
  geserveerd — er is dus **geen redirect** nodig en geen URL verloren.
  🚨 **Bij een tenant die NIET IZZI Beauty is: leeg deze collectie.** Het zijn IZZI's eigen artikelen
  mét IZZI's SEO-titels; onder een ander merk publiceren geeft **duplicate content** en schaadt beide
  sites. Houd één post over als vormvoorbeeld en verwijder de rest (zie de checklist in `README.md`).
- `content/<locale>/info.json` en `content/<locale>/legal.json` → keyed per slug, maar deze hebben WÉL
  een eigen klein route-bestand per pagina (bv. `app/[locale]/uwv-subsidie/page.tsx`) dat één key
  rendert. Voor een geheel nieuwe info/juridische pagina: voeg de key toe (in elke taal) én maak een
  klein route-bestand naar het patroon van een bestaande (bv. kopieer `app/[locale]/uwv-subsidie/page.tsx`).
- `content/<locale>/shop.json` → **geen collectie.** Eén object met alleen webshopteksten (hero, intro,
  cta) en UI-labels onder `ui`. De `products`-array is bewust leeg: producten komen uit de
  CMS-database. Voeg hier dus **nooit** keys per product toe — zie het webshop-hoofdstuk bovenaan.
  ⚠️ De URL van een info-pagina is dus NIET automatisch gelijk aan zijn key: twee keys worden vanaf een
  genest pad geserveerd (`veelgesteldevragen-lippen` → `/pmu-opleiding-lippen/veelgesteldevragen-lippen`,
  `online-trainingen-veelgestelde-vragen` → `/online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen`).
  Kijk dus altijd in `app/[locale]/**` welk route-bestand een key rendert vóór je een link zet.

## ⭐ Velden die er sinds de cursusmodus bij zijn gekomen

Deze staan in de content-JSON en zijn dus door jou te bewerken, maar drie ervan gaan STIL kapot als
je ze verkeerd zet. Lees dit voor je een opleiding of artikel aanraakt.

### `productHandle` (opleiding) — koppelt de pagina aan het webshopproduct

In `trainings-detail.json`. Staat hij gevuld ÉN staat de webshop aan, dan wordt de knop
"Inschrijven" en gaat hij naar `/product/<handle>`.

    cursuspagina                     productHandle                    productslug in het CMS
    /lip-blush-beginnersopleiding →  opleiding-lip-blush-beginners  = opleiding-lip-blush-beginners

⚠️ **Moet teken voor teken gelijk zijn aan de productslug in de CMS-database.** Klopt hij niet, dan
geeft de knop een **404** — zonder build-fout en zonder waarschuwing. Alleen doorklikken vindt dat.

⚠️ **Verzin er nooit een.** Je kunt de database niet zien, dus je kunt niet controleren of het
product bestaat. Laat het veld met rust; het CMS zet het.

Elke handle begint met `opleiding-`. Dat voorkomt dat een productslug botst met een contentslug —
bij een botsing serveert Next de statische pagina en is de productpagina permanent onbereikbaar.

Geen handle = de pagina houdt zijn "Neem contact op"-knop. Dat is de juiste keuze voor maatwerk
zonder vaste prijs of datum.

### `status: "draft"` (blogartikel) — houdt een artikel van de site af

In `blog.json`, per post. `draft` betekent: nergens zichtbaar — niet in een overzicht, niet in de
kennisbank, niet in de sitemap, en `/<slug>` geeft een 404. Alleen `/preview/<slug>` toont hem.

Afwezig of iets anders telt als gepubliceerd, dus bestaande artikelen blijven staan.

Alles loopt via `getPublishedPosts()` in `content/blog.ts`. Gebruik `getPosts()` alleen waar je de
status zélf afhandelt (de detailroute en de previewroute doen dat).

### `highlights` (opleiding) — de band onder de hero

Twee of drie regels die bovenaan een opleidingspagina staan: UWV-subsidie, gespreid betalen,
CRKBO-erkend.

⚠️ **Alleen invullen wat de pagina zelf al beweert.** Elke regel is afgeleid van `aside.facts` van
diezelfde pagina — UWV alleen als de facts het noemen, gespreid betalen alleen als de prijsregel
termijnen noemt. Zet er nooit iets in dat de rest van de pagina niet zegt.

### `videoUrl` (behandeling/opleiding) — YouTube-video in de pagina

Elke vorm waarin YouTube een link uitdeelt mag (watch, youtu.be, /embed, /shorts). `VideoEmbed`
haalt het id er zelf uit en rendert **niets** bij een onbruikbare link. Leeg laten als je geen
geverifieerde video hebt.

`InfoContent` heeft daarnaast een `videos`-array (meerdere video's met titel), gebruikt door
`/videos`.

### `requiresShipping` — NIET in content

Dit komt uit de CMS-database, per product. Bij een opleiding staat hij op `false` en slaat het
afrekenen het bezorgadres over. Je kunt en hoeft hier niets aan te doen; hij staat hier alleen zodat
je hem herkent in `lib/commerce/types.ts`.

---

## Herbruikbare renderers (in `components/sections.tsx`)

`HubPage`, `DetailPage`, `LocationPage`, `InfoPage`, `LegalPage`, `PageHero`, `CardGrid`,
`PriceList`, `Steps`, `FaqList`, `Gallery`, `ReviewGrid`, `ReviewMarquee`, `CtaBand`, `BlogGrid`,
`VideoEmbed` (in `components/VideoEmbed.tsx`).
Nieuwe pagina van een bestaand type heeft doorgaans GEEN nieuwe renderer nodig — alleen nieuwe data.
Interne links in renderers gebruiken `<LocaleLink>` (niet `<Link>`), zodat de taalprefix klopt.

## Types

Alle content-types staan in `lib/types.ts` (o.a. `HomeContent`, `SiteContent`, `HubContent`,
`DetailContent`, `DetailCollection`, `LocationPageContent`, `BlogPost`, `PrijzenContent`,
`OverContent`, `PortfolioContent`, `ContactContent`, `InfoContent`, `LegalContent`, `TeamMember`).
`DetailContent` heeft er sinds de cursusmodus `productHandle`, `highlights` en `videoUrl` bij;
`InfoContent` heeft `team` en `videos`; `BlogPost` heeft `status`. Types zijn
taal-neutraal (elke taal heeft dezelfde vorm). Kopieer de vorm; verzin geen nieuwe velden tenzij nodig.

## Media

> ⚠️ **Lever je zelf beeld aan? Lees `AGENT-INSTRUCTIONS.md` — dat is leidend voor media.**
> Kort: een bestand heeft naast de bytes ook een DB-record nodig, anders geeft `/media/<bestand>`
> een 404. Nieuwe bestanden horen in `media/_import/<tenant-slug>/` en worden daarna via
> **CMS → Media → Importeren** geregistreerd. Nooit rechtstreeks in de opslagmap zetten.

Gebruik `<Media src={…} shape="card|wide|portrait|square|free" label="…" />` voor content-beelden
(geen kale `<img src="">`). Laat `image`/`images` velden **leeg** bij nieuwe content — de placeholder
verschijnt vanzelf; de klant vult later beeld via de CMS. Mediapaden zijn `/media/<bestand>` — taal-neutraal (nooit `/nl/media/...`).
Vul een pad alleen in als je geverifieerd hebt dat het bestand bestaat; bij twijfel leeg laten.

## editable.json

`content/editable.json` (plat, taal-neutraal) bepaalt welke content-bestanden in de CMS Content
Editor verschijnen. `file` is enkel de basisnaam (`home.json`). De collecties met detailpagina's
(`services.json`, `trainings-detail.json`, `locaties.json`) staan er al in met `"itemsArePages": true`
en **`"itemBase": ""`** (leeg = vlakke URLs, dus key `x` → `/x`). Voeg een regel toe alléén voor een
écht nieuw content-bestand (nieuw paginatype), niet voor een nieuwe key in een bestaande collectie.

⚠️ **`itemsKey` bij een genest bestand.** Die drie collecties ZÍJN zelf de map, dus daar hoeft niets.
`blog.json` niet: de artikelen zitten onder een `posts`-sleutel. Zonder `"itemsKey": "posts"` leest
de editor het hoogste niveau en biedt hij `index` en `posts` aan als de twee "pagina's" — de vijftig
artikelen blijven dan onbereikbaar. Staat er een wrapper omheen, zet dan altijd `itemsKey`.

Eén bestand mag **meerdere regels** hebben, met een ander label en pad. Zo staat `blog.json` er twee
keer in: als "Blog (index + artikelen)" en als "Kennisbank (overzicht + categorieën)", en `info.json`
zeven keer — één per pagina die het rendert. Zo vindt een redacteur een pagina op haar eigen naam.
Zet er GEEN systeembestanden in (`forms.json`, `redirects.json`, `i18n.json`).

`shop.json` staat er wél in (label "Webshop (teksten & labels)") omdat de klant zijn eigen webshopkoppen
en knopteksten mag aanpassen. Dat is veilig: er staan geen prijzen of producten in. Zou je daar ooit
productgegevens aan toevoegen, dan komen prijzen onder de Content Editor te staan — precies wat de
architectuur verhindert.

## Forms & redirects

Zie de universele conventies in de system-prompt: `content/forms.json` (+ `<Form slug="…"/>`) en
`content/redirects.json` — beide **plat in `content/`, taal-neutraal**. Niet zelf een submit-handler
of `next.config` redirect schrijven. Redirect-`source`/`destination` zijn prefix-vrij (mogen meerdere
segmenten hebben); de site verzorgt de taalprefix per taal. `redirects.json` bevat **30 regels**: de
oude keyword-URLs van de stadspagina's wijzen naar de korte slug (zie het hoofdstuk over vlakke URLs).

Twee dingen die er bewust NIET in staan: toen de twee FAQ-pagina's naar hun geneste pad verhuisden is
er **geen redirect** gezet (keuze van de klant) — die oude vlakke URLs geven 404. Voeg dus niet op
eigen initiatief redirects toe; doe dat alleen als de klant het vraagt.
