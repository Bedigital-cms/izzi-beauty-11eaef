# IZZI Beauty — migratie-inventaris, URL/CTA/media/cursus-mapping & conflictenlog

Bron: oude site `https://izzi-beauty.com` (alleen passieve leesacties: sitemaps + losse GET's; geen add-to-cart, logout, checkout of formulierverzending). Nieuwe kant: deze repo (branch `cursor/izzi-finalization-sprint-1-8cf5`).

Volledige legacy-URL-lijst: [`docs/izzi-legacy-urls.txt`](./izzi-legacy-urls.txt) (301 URL's).

## 1. Bron-inventaris (methode + dekking)

| Sitemap | URL's | Type | Status |
| --- | --- | --- | --- |
| `page-sitemap.xml` | 125 | Pagina's (behandelingen, opleidingen, steden, info, juridisch) | OPGEHAALD |
| `post-sitemap.xml` | 50 | Blog/kennisbank-artikelen | OPGEHAALD (slugs komen 1-op-1 overeen; al gemigreerd in `blog.json`) |
| `product-sitemap.xml` | 128 | WooCommerce-producten (cursusdata-varianten) + winkelpaden | OPGEHAALD; **INHOUDELIJKE vergelijking BLOCKED_ACCESS** (commerce uit + CMS onbereikbaar) |

Oude URL-vorm: **`/nl/<slug>/`** (met taalprefix én trailing slash) voor pagina's/posts; producten op **`/product/<handle>/`** (geen `/nl`). Dit is direct relevant voor de redirects (zie §3).

Dekking-eerlijkheid: pagina/post-URL's zijn OPGEHAALD en op slug-niveau vergeleken met de nieuwe routes/collecties (script). Volledige sectie-voor-sectie **INHOUDELIJKE** vergelijking (koppen, dagschema's, voorwaarden, materialen) is per pagina nog **OPEN** en vergt de echte oude pagina-body's; representatieve pagina's zijn bekeken. Producten zijn niet inhoudelijk vergeleken (BLOCKED_ACCESS).

## 2. Slug-resolutie (pagina's/posts, 165 unieke slugs)

- **94** resolven direct (zelfde slug bestaat als route/collectie).
- **18** worden door bestaande `redirects.json`-regels gedekt (de stad-keywordslugs).
- **53** missen (geen route én geen redirect) → zouden 404 geven. Zie §3.

## 3. Legacy-URL → nieuwe-URL redirect-mapping (voorstel)

> ✅ **Opgelost (P1):** de redirect-expansie in `next.config.ts` emit nu bij één actieve taal óók de geprefixte regel. Getest: `/nl/wenkbrauwen-haarlem` → **308** `/nl/haarlem` (was 404); trailing slash + querystring behouden; kale vorm in één hop; bestaande pagina's 200; geen loop/dubbele prefix. Onderstaande content-equivalenten zijn hierdoor **toegevoegd aan `content/redirects.json`** en werken voor de echte `/nl/`-URL's.

Statuscode: alle regels gebruiken `permanent: true` = **HTTP 308** (Next-native), niet 301.

### 3a. Toegevoegd — inhoudelijk geverifieerde content-equivalenten (onderwerp op oude site gecontroleerd)
| Oude slug (`/nl/…`) | Oud onderwerp (titel/h1) | Nieuwe bestemming | Toegevoegd |
| --- | --- | --- | --- |
| `over-izzi-beauty` | Over IZZI Beauty | `/over-izzi` | ✅ |
| `permanente-make-up-portfolio` | Portfolio | `/portfolio` | ✅ |
| `permanente-make-up-prijzen` | Prijzen | `/prijzen` | ✅ |
| `permanente-make-up-veelgestelde-vragen` | Veelgestelde Vragen | `/veelgestelde-vragen` | ✅ |
| `vacature-pmu-artist-bij-izzi-beauty` | Vacature | `/werken-bij-izzi-beauty` | ✅ |
| `permanente-eyeliner` | PMU Eyeliner (behandeling) | `/permanente-make-up-eyeliner` | ✅ |
| `permanente-make-up-opleiding` | Opleiding | `/opleidingen` | ✅ |
| `online-permanente-make-up-opleiding` | Online opleiding | `/online-trainingen` | ✅ |
| `permanente-make-up-behandeling` | Behandeling | `/behandelingen` | ✅ |
| `prive-opleiding` | Privé opleiding | `/prive-opleiding-permanente-make-up` | ✅ |
| `lippigmentatie` | Lippigmentatie / PMU Lippen (behandeling) | `/lip-blush` | ✅ |
| `pmu-lippen` | PMU Lippen (behandeling) | `/lip-blush` | ✅ |
| `ombre-powder-brows` | Ombre Powder Brows behandeling | `/powder-brows` | ✅ |
| `permanente-make-up-wenkbrauwen` | PMU Wenkbrauwen (behandeling) | `/powder-brows` | ✅ |
| `brow-lift` | Brow Lift Behandeling | `/brow-lamination-behandeling` | ✅ |

### 3a-conflict. Bewust NIET geredirect (bronconflict/beslissing)
| Oude slug | Oud onderwerp | Waarom niet | 
| --- | --- | --- |
| `lash-lift` | Lash Lift **behandeling** | Nieuwe site heeft alleen de `lash-lift-training` **opleiding**; een behandeling niet naar een opleiding sturen. Bied de behandeling aan óf beslis 404/hub |
| `isabella-levels` | Persoonspagina (specialist) | Geen team-detailroute; `/ons-team` verliest de persoonsdetail — beslissing nodig |

### 3b. Overige nog te mappen (midden/laag — bevestiging nodig, nog niet toegevoegd)
| Oude slug (`/nl/…`) | Kandidaat | Zekerheid |
| --- | --- | --- |
| `faux-freckles-opleiding` | `/faux-freckles-beginners` | midden |
| `fineline-tattoo-opleiding` | `/fineline-training` | midden |
| `infralash-beginnersopleiding` | `/infralash-beginners` | midden |
| `tattoo-verwijderen` | `/tattoo-verwijderen-rotterdam-amsterdam` | midden |

### 3b. Slug-botsingen behandeling ⇄ opleiding — BRONCONFLICT, bevestiging nodig
| Oude slug | Kandidaat-bestemming(en) | Waarom onzeker |
| --- | --- | --- |
| `lippigmentatie` / `pmu-lippen` / `permanente-make-up-lippen` | `/lip-blush` (behandeling) | Kan ook naar lip-opleiding wijzen; bedoeling bevestigen |
| `ombre-powder-brows` / `permanente-make-up-wenkbrauwen` | `/powder-brows` (behandeling) | Idem, evt. `/ombre-powder-brows-opleiding` |
| `brow-lift` | `/brow-lamination-behandeling` | Oude site verwarde Brow Lift/Lamination (zie conflictenlog) |
| `lash-lift` | `/lash-lift-training` (opleiding) — geen losse behandeling | Als behandeling niet aangeboden: naar opleiding of `/behandelingen` |
| `airbrush-brows-opleiding` | `/airbrush-brows-online-training` | Online vs klassikaal onderscheiden |
| `isabella-levels` | `/ons-team` (of teamdetail) | Persoonspagina; teamdetailroute bestaat niet |

### 3c. NIET redirecten (transient/utility/campagne)
`afspraak-maken`, `bedankt-boeking`, `contact-bedankt`, `bedankt-voor-je-aanmelding`, `terugbetalen_retournering`, `__trashed`, `zomeractie-rotterdam` (verlopen actie), `my-account`/`mijn-account`, `shop`/`shop-2`/`webshop`/`winkel`/`winkelwagen` (commerce → Laliqa/CMS; commerce-fase van deze release).

### 3d. Geneste FAQ-URL's (oud → nieuw, bewuste keuze)
Oude `pmu-opleiding-*/…-veelgestelde-vragen` paden ↔ de twee bewust-geneste FAQ-routes (zie `ai-guide.md`). Klant koos eerder **geen** redirect voor deze; bevestigen of dat zo blijft.

## 4. CTA-intentie-mapping (productgrens §2)

| Context | Huidige CTA | Bedoelde actie | Status |
| --- | --- | --- | --- |
| Behandelingen/intake | `/contact` → Salonized-widget | Boeken via Salonized | OK (widget is tenant-config) |
| Home "Lip Blush Opleiding"-kaart | ~~`/lip-blush`~~ → `/lip-blush-beginnersopleiding` | Opleiding | **FIXED** |
| Fysieke opleiding-detail | "Inschrijven" → `/product/<handle>` als `productHandle` + commerce aan | cursus → datum/locatie → mandje → betaling IZZI | BLOCKED (commerce uit, handles onzichtbaar) |
| Online-hub-kaarten (8/9) | `/contact` | eigen cursuscontent → betaling IZZI → Academy-toegang | BLOCKED (content + handle + LearnDash) |
| Online "Airbrush Brows" | `/airbrush-brows-online-training` | eigen pagina | OK (enige online-cursus met echte pagina) |
| Webshop (retail/machines) | `https://laliqa.com` (extern) | Laliqa | **FIXED** |
| Laserontharen | `https://izziclinic.nl` (extern) | IZZI Clinic | **FIXED** |

## 5. Media-keten (§5) — wat is wél en niet vastgesteld

Meetresultaat vanaf deze runtime: `/media/<file>` (route `app/media/[filename]/route.ts`) → **302** → `https://cms.bedigital.ai/media/<file>?tenant=izzi-beauty` → **TLS reset** (`OpenSSL SSL_ERROR_SYSCALL`; DNS ok → 216.150.16.1, TCP:443 ok, TLS-handshake geweigerd). In de browser: `net::ERR_CONNECTION_CLOSED`, `img.naturalWidth === 0` voor logo én alle content-beelden.

- **Vastgesteld:** een *verbindingsfout vanuit deze onderzochte runtime* naar het CMS-endpoint.
- **Niet vastgesteld:** de *uiteindelijke oorzaak van ontbrekende beelden bij echte bezoekers*. De TLS-reset zegt niets over de juistheid van opslag, CMS-records, tenantmapping of media-import — die zijn **niet** fout bewezen. Het is dus **geen** bewijs dat het aan de oude R2/gitignored `_import` (MEDIA.md, historisch) ligt.
- **Nog te testen (geautoriseerd, op een omgeving die het CMS bereikt):** vergelijk (a) lokale site-media-URL, (b) dezelfde URL op de **echte PR-preview** (Vercel — niet geverifieerd; géén bewijs dat Vercel de bytes wél haalt), (c) direct CMS-media-endpoint, (d) de uiteindelijke opslagrespons. Rapporteer per stap statuscode, redirectketen, `Content-Type` en of het bestand echt als afbeelding **decodeert**. Verifieer de huidige opslag (Supabase Storage vs oude R2) in `Be-digital-cms` (nu 404 voor dit token).

## 6. Conflictenlog (oude site bevat fouten — niet blind overnemen)
| Conflict | Waarneming | Actie |
| --- | --- | --- |
| Prijzen | Homepage-tarieven vs `prijzen.json` vs Salonized-widget kunnen verschillen | Actuele bron = boekingswidget/`prijzen.json`; klant bevestigen. Niet verzonnen |
| Toegangstermijn online | Hub: "levenslange toegang" vs oude Airbrush/Naaldentraining "90 dagen" | Per product bevestigen |
| Brow Lift ⇄ Lash Lift | Oude site verwees Lash Lift op Brow Lamination-context | Correcte dienst bevestigen |
| Cohortjaren/data | Oude productdata bevat verlopen cursusjaren | Actuele slots server-side; niet in redactionele JSON dupliceren |
| Verzendteksten op digitale cursussen | Generieke WooCommerce-verzendtekst op online producten | `requiresShipping=false` server-side; niet als content |
| Starterspakket/groepsgegevens | Tegenstrijdige aantallen op oude site | Bevestigen |
| Rotterdam-adres | home.json "Nog niet bekend"; bronkandidaat Weena 95/3013 CH | Klant bevestigen; niets verzonnen live |
| WhatsApp-nummer | `31612345678` (placeholder) vs `+31 6 11 76 88 81` | Via CMS Integraties + WhatsApp-geschiktheid bevestigen |
| All Round startpakket-waarde | oude pagina noemt €4.000 én €4.500 (zelfde pagina) | Niet stil gekozen; op de nieuwe pagina zonder euro-waarde, "via offerte" |
| All Round machinewaarde | oude pagina noemt €1.000 én €470 | Idem; geen bedrag op de pagina |
| All Round prijs | actie €9.000 / termijnen €9.900 (+ 2025-data, Den Bosch) | Volatiel → niet in editorial JSON; "Prijs op aanvraag", data/locatie via offerte/CMS |

### 8. Sectie-voor-sectie contentpariteit — status
Methode: oude pagina opgehaald (passieve GET), sectie/feit-vergelijking met de huidige JSON, stabiele content gemigreerd, volatiele/conflicterende waarden neutraal of geflagd.

| Pagina | Type | Oud opgehaald | Vergeleken | Actie in deze PR |
| --- | --- | --- | --- | --- |
| `allround-pmu-opleiding` | opleiding | ✅ | ✅ | **Verrijkt**: programma (4 online + 4 praktijk), inclusief/startpakket, algemene info, CRKBO/UWV, 7 echte FAQ; conflicten geflagd, prijs neutraal |
| `ombre-powder-brows-opleiding` | opleiding | ✅ | ✅ | Al rijk gemigreerd (programma/startpakket/machine/prijs/trainers/10 FAQ) — geen gap; prijs bevestigen |
| `lip-blush-beginnersopleiding` | opleiding | ✅ | ✅ | Al rijk gemigreerd — geen gap; prijs bevestigen |
| `powder-brows` | behandeling | ✅ | ✅ | Correct (behandeling, geen opleiding-mixup), video + FAQ, geen `productHandle` (boekt via Salonized/contact) — OK |
| `lip-blush` | behandeling | ✅ | ✅ | Correct (behandeling), video + 5 FAQ — OK |
| Overige opleidingen (Combi, Infralash, Faux Freckles, Fineline (2), masterclasses, Ombré+Lip Blush, Privé, Saline, Inkless, Lash Lift, Brow Lamination, Laser Ontharing) | opleiding | ✅ | ✅ | **Al rijk gemigreerd** (body 6–10 secties, 6–10 FAQ, volledige facts). Deze PR: CRKBO/certificaat-fact semantisch gesplitst (12×). Prijs/data/plaatsen = CMS/klant |
| Behandelingen (Combi, Infralash/eyeliner, Faux Freckles, Kleurcorrectie, Brow Lamination, removal/correctie, nazorg, stads-/vergelijkpagina's) | behandeling | ✅ | ✅ | **Al rijk gemigreerd**; geen behandeling/opleiding-mixup; booking-CTA correct. `powder-brows` was dun (nog te verrijken). Absolute claims ("pijnloos" 16×) = bestaande copy → klant-/medische review, niet zelfstandig herschreven |

**Kennisbank interne links (§8):** al systematisch geïmplementeerd via `getCategoryLinks`/`CATEGORY_LINKS` — elk van de 50 artikelen krijgt via zijn categorie relevante interne links (behandelingen, opleidingen, online trainingen, UWV, FAQ) in de sidebar. Alle 13 gebruikte categorieën zijn gemapt (0 artikelen zonder links). Slugs/metadata/inhoud ongewijzigd; `/blog` + `/blog/page/N` blijven operationeel; geen blanket redirect.

**Online trainingen (§5/§6):** 8 hubkaarten zonder eigen pagina gaan nu naar een prefilbaar interesseformulier op de online hub (`/online-trainingen?opleiding_specifiek=<cursus>#informatie-aanvragen`), eerlijke CTA "Beschikbaarheid opvragen", geen kale `/contact`. Airbrush heeft een eigen pagina. Per-cursus detailpagina's vergen de geblokkeerde WooCommerce/LearnDash-broncontent (geen fabricage). Blanket "levenslang toegang" verwijderd.

**Redirects:** totaal **59** regels (30 origineel + 29 in deze PR), alle `permanent:true` = **308**, prefix + kale + trailing slash + querystring getest. `/lash-lift` en `/isabella-levels` bewust open (conflict).

Belangrijk: **actuele prijs, aanbieding, opleidingsdatum, aantal plaatsen en betaaltermijnen** blijven server-/CMS-/klantbevestigde data — niet als tweede catalogus in editorial JSON. Medische/nazorgteksten van de oude site zijn **niet** zelfstandig als medische waarheid gemoderniseerd (bron behouden / klantreview).

## 7. Productmapping-skelet (§8) — in te vullen met echte handles/LearnDash
Voor elk van: Ombre Powder Brows, Combi Brows, Powder Brows Touch-up, Powder Brows Masterclass, Soft Ombre, Lip Blush, Lip Blush Masterclass, Royal Lips, Ombre Lips Masterclass, Faux Freckles, Kleurcorrectie, Naaldentraining, Lash Lift, Brow Lift, Airbrush Brows, GGD-stappenplan, Inkless Stretch Mark:

`oud product-URL/SKU  →  nieuwe product/variant-handle  →  LearnDash-cursus-id  →  content-pagina`

Status: **BLOCKED_ACCESS** — handles/cursus-id's staan in de CMS-DB/LearnDash (niet zichtbaar; commerce uit). Geen fictieve ID's ingevuld. 128 product-URL's in `product-sitemap.xml` zijn de databron voor de oude kant. Bevestigd: de oude online-cursuspagina's draaien op **LearnDash** (`ldVars`/postID in de HTML).

### 7a. Online-cursussen — status per cursus (A: broninhoud · B: pagina · C: product · D: betaling · E: toegang)
Legenda per kolom: ✅ gedaan · ◐ deels · ✗ geblokkeerd/ontbreekt.

| Cursus | A bron | B pagina | C product | D betaling | E toegang |
| --- | --- | --- | --- | --- | --- |
| Online Airbrush Brows | ✅ | ✅ `/airbrush-brows-online-training` (bestaat, gelinkt) | ✗ (handle onbekend) | ✗ | ✗ |
| Online Ombré Powder Brows | ◐ (oude hub/product) | ✗ | ✗ | ✗ | ✗ |
| Online Combi Brows | ◐ | ✗ | ✗ | ✗ | ✗ |
| Online Powder Brows Masterclass | ◐ | ✗ | ✗ | ✗ | ✗ |
| Online Lip Blush | ◐ | ✗ | ✗ | ✗ | ✗ |
| Online Lip Blush Masterclass | ◐ | ✗ | ✗ | ✗ | ✗ |
| Online Faux Freckles | ◐ | ✗ | ✗ | ✗ | ✗ |
| Online Kleurcorrectie | ◐ | ✗ | ✗ | ✗ | ✗ |
| Online Naaldentraining | ◐ | ✗ | ✗ | ✗ | ✗ |

Toelichting: per-cursus detailinhoud (lesonderdelen, FAQ, beelden, toegangstermijn) staat grotendeels in de **WooCommerce-productpagina's** (128 stuks) — die zijn hier niet leesbaar (commerce uit, CMS onbereikbaar), dus B kan niet zonder fabricage worden ingevuld voor 8/9 cursussen. De hubkaarten wijzen daarom nog naar `/contact` (regressietest markeert dit als OPEN, geen schijnoplossing). Zodra de productpagina's leesbaar zijn: redactionele cursuspagina's als `trainings-detail`-keys (zonder `productHandle` → eerlijke "informatie/contact"-CTA tot commerce aanstaat), daarna handle + LearnDash koppelen. **Toegangstermijn-conflict** (nieuwe hub "levenslang" vs oude 90 dagen) is niet uit de hubs te bevestigen → klantbesluit.
