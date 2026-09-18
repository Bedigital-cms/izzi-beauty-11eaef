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

> ⚠️ **Blokkerende voorwaarde (P1):** de redirect-expansie in `next.config.ts` emit bij één actieve taal alléén de kale regel (`/oud → /nieuw`). De echte geïndexeerde oude URL's zijn `/nl/<slug>/`. Getest: `/nl/wenkbrauwen-haarlem` → **404**, terwijl `/wenkbrauwen-haarlem` → **308** `/haarlem`. Zolang de plumbing-fix (zie [runbook](./izzi-deployment-runbook.md)) niet is toegepast, **werken onderstaande regels niet voor de daadwerkelijke `/nl/`-URL's**. Daarom hier als voorstel vastgelegd en (nog) niet in `redirects.json` gezet, om geen vals vertrouwen te wekken.

Statuscode: bestaande + voorgestelde regels gebruiken `permanent: true` = **HTTP 308** (Next-native), niet 301.

### 3a. Heldere content-equivalenten (voorstel toe te voegen na plumbing-fix + bevestiging)
| Oude slug (`/nl/…`) | Nieuwe bestemming | Zekerheid |
| --- | --- | --- |
| `over-izzi-beauty` | `/over-izzi` | hoog |
| `permanente-make-up-portfolio` | `/portfolio` | hoog |
| `permanente-make-up-prijzen` | `/prijzen` | hoog |
| `permanente-make-up-veelgestelde-vragen` | `/veelgestelde-vragen` | hoog |
| `vacature-pmu-artist-bij-izzi-beauty` | `/werken-bij-izzi-beauty` | hoog |
| `permanente-eyeliner` | `/permanente-make-up-eyeliner` | hoog |
| `permanente-make-up-opleiding` | `/opleidingen` | hoog |
| `online-permanente-make-up-opleiding` | `/online-trainingen` | hoog |
| `permanente-make-up-behandeling` | `/behandelingen` | hoog |
| `prive-opleiding` | `/prive-opleiding-permanente-make-up` | hoog |
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
`afspraak-maken`, `bedankt-boeking`, `contact-bedankt`, `bedankt-voor-je-aanmelding`, `terugbetalen_retournering`, `__trashed`, `zomeractie-rotterdam` (verlopen actie), `my-account`/`mijn-account`, `shop`/`shop-2`/`webshop`/`winkel`/`winkelwagen` (commerce → Laliqa/CMS, aparte sprint).

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

## 5. Media-keten (§5) — hoofdoorzaakbewijs

`/media/<file>` (route `app/media/[filename]/route.ts`) → **302** → `https://cms.bedigital.ai/media/<file>?tenant=izzi-beauty` → **TLS reset** (`OpenSSL SSL_ERROR_SYSCALL`; DNS ok → 216.150.16.1, TCP:443 ok, TLS handshake geweigerd). In de browser: `net::ERR_CONNECTION_CLOSED`, `img.naturalWidth === 0` voor logo én alle content-beelden.

Conclusie: de faaloorzaak is **niet** de oude R2/gitignored `_import` (MEDIA.md, historisch) maar **egress/host-weigering naar `cms.bedigital.ai` vanaf deze runtime**. Media-QA (naturalWidth>0, crop/topic) kan pas op een omgeving die het CMS wél bereikt (Vercel-preview) of nadat egress is toegestaan. Huidige CMS-opslag (Supabase Storage vs oude R2) niet verifieerbaar zonder CMS/reference-repo-toegang.

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

## 7. Productmapping-skelet (§8) — in te vullen met echte handles/LearnDash
Voor elk van: Ombre Powder Brows, Combi Brows, Powder Brows Touch-up, Powder Brows Masterclass, Soft Ombre, Lip Blush, Lip Blush Masterclass, Royal Lips, Ombre Lips Masterclass, Faux Freckles, Kleurcorrectie, Naaldentraining, Lash Lift, Brow Lift, Airbrush Brows, GGD-stappenplan, Inkless Stretch Mark:

`oud product-URL/SKU  →  nieuwe product/variant-handle  →  LearnDash-cursus-id  →  content-pagina`

Status: **BLOCKED_ACCESS** — handles/cursus-id's staan in de CMS-DB/LearnDash (niet zichtbaar; commerce uit). Geen fictieve ID's ingevuld. 128 product-URL's in `product-sitemap.xml` zijn de databron voor de oude kant.
