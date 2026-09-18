# IZZI Beauty — finalisatie masterchecklist

Status per item van de geconsolideerde implementatie-PR ([#12](https://github.com/Bedigital-cms/izzi-beauty-11eaef/pull/12)).

Legenda: **OPEN** · **IMPLEMENTED_IN_PR** (code/content op de branch) · **VERIFIED** (runtime getest op de PR-preview/lokaal) · **BLOCKED_ACCESS** (omgeving/toegang) · **BLOCKED_CUSTOMER** (klantbesluit/-data nodig) · **BLOCKED_PLATFORM** (wijziging in gedeelde plumbing/CMS/architecture nodig).

> Kernblokkades in deze runtime (bewijs in [runbook](./izzi-deployment-runbook.md)):
> 1. **Media (P0):** *vastgesteld* = verbindingsfout vanuit déze runtime (`cms.bedigital.ai` weigert TLS: `SSL_ERROR_SYSCALL` / `net::ERR_CONNECTION_CLOSED`; DNS+TCP ok). *Niet vastgesteld* = de uiteindelijke oorzaak van ontbrekende beelden bij bezoekers (opslag, records, tenantmapping en import zijn NIET fout bewezen). *Nog te testen* = de volledige keten + daadwerkelijke bestanden op een omgeving die het CMS bereikt (bv. Vercel-preview — niet geverifieerd).
> 2. **Referentierepo's** `Bedigital-cms/Be-digital-cms` en `BEBarry/bedigital-architecture` → **404 "Repository not found"** voor het geauthenticeerde token (`gh api repos/...` en `git ls-remote`). Classificatie: **ontbrekende repository-permissie of onjuiste repo-naam** — géén padprobleem (`/tmp`+`$HOME` zijn schrijfbaar) en géén netwerkfout (publieke IZZI-repo resolveert wél). Site Contract/CMS niet leesbaar; minimaal nodig: leesrechten voor dit token op beide repo's (of de juiste namen).
> 3. **Commerce staat uit** (`NEXT_PUBLIC_COMMERCE_ENABLED=0`), geen sandbox-PSP/LearnDash — checkout/betaal/toegang-flows niet end-to-end testbaar.

> **Sinds de vorige oplevering geïmplementeerd + geverifieerd:** single-locale prefix-redirectfix (`next.config.ts`) → `/nl/<oud>` 308 i.p.v. 404; 15 inhoudelijk geverifieerde legacy-redirects; Rotterdam-bronadres (Weena 95, 3013 CH); toegankelijke formulier-validatie + UWV/opleidingsinteresse/vacature-formulieren; juridische migratieconcepten; uitgebreide regressietests (14 hard, 2 open). Detail hieronder.

## §1 Werkwijze & autorisatie
| Item | Status |
| --- | --- |
| Docs gelezen (CLAUDE/HANDOVER/ai-guide/MEDIA/README + PR + contentmodel) | VERIFIED |
| Werk in PR #12, logische commits, geen merge, geen push naar main | VERIFIED |
| Redactionele content op branch bewerken (geautoriseerd) | IMPLEMENTED_IN_PR |
| CMS-lees/schrijf/publish-pad verifiëren vóór wijzigen | BLOCKED_ACCESS (CMS onbereikbaar; sync-runbook nu als BLOCKED gemarkeerd i.p.v. onbewezen publish-stap) |
| Referentierepo's leesbaar? | BLOCKED_ACCESS — **404 "Repository not found"** voor dit token (permissie/naam), géén pad-/netwerkfout (bewezen: `/tmp`+`$HOME` schrijfbaar, IZZI-repo resolveert) |

## §3 Aangetoonde problemen
| # | Probleem | Status |
| --- | --- | --- |
| 1 | `info@example.com` in site.json + home.json | **IMPLEMENTED_IN_PR + VERIFIED** → `info@izzi-beauty.com` |
| 2 | `forms.json contact.notificationEmail = info@example.com`; effectieve ontvanger | **IMPLEMENTED_IN_PR** (→ izzi-beauty.com). Effectieve ontvanger wordt **server-side door het CMS** bepaald (`notificationEmail` niet in code gebruikt); definitief zetten in CMS → BLOCKED_ACCESS/CUSTOMER |
| 3 | WhatsApp-provider `31612345678` in `integrations.json` | **BLOCKED_CUSTOMER + config-route**: `integrations.json` is tenant-config ("wijzig via Tenants → Integraties"). Juiste nummer (`+31 6 11 76 88 81` → `31611768881`) + WhatsApp-geschiktheid bevestigen; niet direct in repo geëdit (CMS overschrijft). Zie runbook |
| 4 | `legal.json` — voorbeeldteksten op alle 3 juridische pagina's | **BLOCKED_CUSTOMER**: bevat expliciet "Dit is een voorbeeldtekst — vervang deze…". Juridische/medische tekst niet door AI verzinnen. Goedgekeurde teksten nodig |
| 5 | Home-kaart "Lip Blush Opleiding" → `/lip-blush` (behandeling) | **IMPLEMENTED_IN_PR + VERIFIED** → `/lip-blush-beginnersopleiding` |
| 6 | Online-menu/hub: 8/9 kaarten → `/contact`, menulinks → `/online-trainingen` | **OPEN/BLOCKED**: alleen `airbrush-brows-online-training` heeft een echte pagina. Overige 8 online-cursussen vereisen echte cursuscontent + product/LearnDash-mapping (commerce/CMS/LMS) → BLOCKED_ACCESS/CUSTOMER. Niet met `/contact` als schijnoplossing "opgelost" |
| 7 | Onlinehub belooft "levenslange toegang" vs oude 90 dagen (Airbrush/Naaldentraining) | **BLOCKED_CUSTOMER**: toegangstermijn per product bevestigen; bronconflict gelogd |
| 8 | `.form button[type=submit]` gouden gradient | **IMPLEMENTED_IN_PR + VERIFIED** → merkgroen (bg `rgb(33,209,159)`, witte tekst). Salonized-widgetkleur (`#ff0040`) is aparte tenant-config |
| 9 | Preview-media faalt | **BLOCKED_ACCESS**: hoofdoorzaak vastgesteld = `cms.bedigital.ai` TLS-reset vanaf runtime (niet de oude R2/import). Zie runbook |
| 10 | Nieuwe tarieven vs homepageprijzen verschillen | **BLOCKED_CUSTOMER**: prijzen zijn de actuele bron in de boekingswidget/`prijzen.json`; conflict gelogd, niet verzonnen |
| 11 | Ervaringenmanifest niet schema-volledig (InfoPage gebruikt ook `data.cta`) | **Erkend**: `/ervaringen`-vulling vereist `hero` + `cta` + geverifieerde `reviews` → BLOCKED_CUSTOMER (geen verzonnen reviews); menulink bewust nog niet geplaatst |
| 12 | Enkel `nl`, zichtbare prefix; geprefixte legacy-redirects | **IMPLEMENTED_IN_PR + VERIFIED** (met expliciete autorisatie voor `next.config.ts` in de IZZI-repo): `buildRedirects()` emit nu ook de geprefixte regel bij één taal. Getest: `/nl/wenkbrauwen-haarlem` → **308** `/nl/haarlem` (was 404); trailing slash + querystring behouden; kale vorm 1 hop; bestaande pagina's 200; geen loop/dubbele prefix; andere taal-/domeinmodi ongewijzigd |

## §5 Media & logo's (EERSTE technische prioriteit)
| Item | Status |
| --- | --- |
| Keten site `/media` → CMS-endpoint → opslag → bytes | **BLOCKED_ACCESS (deels onderzocht)**: lokaal `/media/..` → 302 → `cms.bedigital.ai` → TLS-reset vanaf deze runtime → geen bytes, `naturalWidth=0`. Dit is een *verbindingsfout vanuit deze runtime*, GEEN bewijs dat opslag/records/tenantmapping/import fout zijn. Direct CMS-endpoint + opslagrespons + PR-preview nog te testen op een omgeving die het CMS bereikt |
| Bewijs dat álle beelden laden (naturalWidth>0, juiste crop/onderwerp) | BLOCKED_ACCESS (kan pas als het CMS bereikbaar is; Vercel-preview niet geverifieerd) |

## §6 Bedrijfsdata, navigatie & knoppen
| Item | Status |
| --- | --- |
| E-mail → info@izzi-beauty.com (site/home/forms) | IMPLEMENTED_IN_PR + VERIFIED |
| Amsterdam behouden; Den Bosch niet actief | IMPLEMENTED_IN_PR (footer) + VERIFIED |
| Rotterdam adres/postcode/telefoon | **IMPLEMENTED_IN_PR** (bron = publieke contactpagina): Weena 95, 3013 CH toegevoegd aan footer + home contactSection; gedeeld nummer +31 6 11 76 88 81. **Openingstijden Rotterdam** nog **BLOCKED_CUSTOMER** (niet verzonnen; LocationCards toont de klok-regel alleen als bekend). Actuele bevestiging Rotterdam-adres/nummer gewenst |
| Telefoon/structured data/kaartlinks controle | OPEN (afh. Rotterdam-bevestiging + media) |
| Hoofdmenu exacte volgorde + externe bestemmingen | IMPLEMENTED_IN_PR + VERIFIED (DOM: externe links zonder locale-prefix, `target=_blank rel=noreferrer`) |
| Over IZZI dropdown | IMPLEMENTED_IN_PR + VERIFIED (Ervaringen bewust uitgesteld) |
| Extra → Extra Opleidingen samenvoegen | IMPLEMENTED_IN_PR + VERIFIED |
| Carbon Laser Peeling opgelost (kapotte link) | IMPLEMENTED_IN_PR + VERIFIED (verwijderd; geen pagina verzonnen) |
| Footer Blogs → Kennisbank | IMPLEMENTED_IN_PR + VERIFIED |
| Verkeerde Lip Blush-opleidingslink | IMPLEMENTED_IN_PR + VERIFIED |
| FAQ-accordeon + behandel-hero (PR12) | IMPLEMENTED_IN_PR + VERIFIED (layout/gedrag; met echte beelden → BLOCKED_ACCESS) |
| CTA-knoppen groen incl. forms | IMPLEMENTED_IN_PR + VERIFIED |
| Contrast wit-op-#21D19F beslissing | **BLOCKED_CUSTOMER**: 1.97:1 < 4.5:1. Keuze voorgelegd (A: donkere tekst op #21D19F = 8.83:1; B: donkerder groen bv. #147d5f + witte tekst). Niet stil gewijzigd, niet met alleen een comment "opgelost" |

## §7 Behandelingen, opleidingen, portfolio, reviews
| Item | Status |
| --- | --- |
| Volledige broncontent per pagina herstellen | OPEN (inventaris gemaakt; inhoudelijke vergelijking deels — zie mapping-doc) |
| YouTube-video's/Shorts 16:9 / 9:16 | OPEN (bron-inventaris; `VideoEmbed` ondersteunt het al) |
| Portfolio ontbrekende resultaten | BLOCKED_ACCESS (beelden/CMS) |
| Ombre Lips/Lipliner behandeling vs online opleiding | BLOCKED_CUSTOMER (bevestigen welke diensten echt worden aangeboden) |
| Reviews verifiëren + /ervaringen vullen | BLOCKED_CUSTOMER (geen geverifieerde bron; niet verzinnen) |
| Juridische teksten vervangen | BLOCKED_CUSTOMER |

## §8 Online cursussen, slots, checkout, toegang
| Item | Status |
| --- | --- |
| Productmapping (17+ cursussen) oud ID/SKU → handle + LearnDash | **BLOCKED_ACCESS/CUSTOMER**: 128 WooCommerce-producten in oude sitemap; handles/DB niet zichtbaar (commerce uit, CMS onbereikbaar). Mapping-skelet in mapping-doc; geen fictieve ID's |
| Checkout/slot/betaling/order/mail/toegang sandbox-test | BLOCKED_ACCESS (commerce uit, geen sandbox-PSP) |
| Mollie in3 verificatie | BLOCKED_CUSTOMER/ACCESS (merchant-toelating + limieten EUR50–5000) |
| LearnDash handmatige activatie-overdracht | BLOCKED_CUSTOMER (eigenaar/reactietijd/subdomein) — runbook-skelet aanwezig |

## §9 Formulieren, tracking, SEO
| Item | Status |
| --- | --- |
| Contact/UWV/opleiding/vacature-flows compleet | **IMPLEMENTED_IN_PR + VERIFIED (client)**: `uwv`, `opleiding-interesse`, `vacature` toegevoegd aan `forms.json` en gekoppeld (uwv-subsidie, werken-bij-izzi-beauty, opleidingen-hub). Toegankelijke client-validatie (verplicht + e-mail, aria-invalid + role=alert, focus, invoerbehoud, dubbelklik-blokkering) headless getest |
| Echte formulierontvangst testen (testmailbox) | BLOCKED_ACCESS (CMS-submit-endpoint onbereikbaar; dev-submit/mock is geen acceptatietest — alleen backendverwerking/tenantcontrole/ontvangst blijft open) |
| GTM/CMP/GA4/Ads/Meta config | BLOCKED_ACCESS: alleen Salonized + WhatsApp in `integrations.json`; providers via CMS Integraties. Geen losse trackers toegevoegd |
| Legacy-URL-mapping + statuscodes | **IMPLEMENTED_IN_PR + VERIFIED**: 301 legacy-URL's geïnventariseerd; **15 inhoudelijk geverifieerde** redirects toegevoegd (onderwerp op oude site gecontroleerd; geen blanket naar home/contact/hub). `/lash-lift` (behandeling→alleen opleiding) en `/isabella-levels` (persoonspagina) bewust NIET geredirect → conflict/beslissing. `permanent:true` = **308** (geen 301). Zie mapping-doc |
| Kennisbank hoofdingang zonder artikelverlies + /blog/page/N | OPEN/BLOCKED_CUSTOMER (redirectstrategie-beslissing; zie manifest) |

## §10 Verbeteringen & eindvalidatie
| Item | Status |
| --- | --- |
| Scanbare programma's + eerstvolgende-opleidingen-overzicht met filters | OPEN (afh. echte slotdata/commerce) |
| Brochure-voorbeeld (1, template-akkoord eerst) | OPEN |
| Regressietests | IMPLEMENTED_IN_PR + VERIFIED (`pnpm test`: harde checks + expliciet gerapporteerde OPEN-items; telling niet hardcoded in docs) |
| typecheck/lint/build | VERIFIED (exit 0; 1 pre-existing lint-warning in next.config.ts) |
| Preview-QA met geladen media @360/390/768/1280/1440 | PARTIAL/BLOCKED_ACCESS: layout getest headless; media niet laadbaar in runtime |

## Samengevat P0/P1 die merge blokkeren
- **P0** Media/logo's laden niet vanaf deze runtime (verbindingsfout naar CMS); echte bezoekersoorzaak NIET vastgesteld — §5 kan pas worden afgetekend op een omgeving die het CMS bereikt.
- **P0** Commerce/checkout/online-cursus-toegang niet getest (commerce uit, geen sandbox/LearnDash) — onderdeel van deze release, runtime-aftekening later in deze PR zodra toegang er is.
- ~~**P1** `/nl/`-geprefixte legacy-redirects → 404~~ → **OPGELOST + geverifieerd** (fix in `next.config.ts`, in deze PR).
- **P1** Contrastbesluit CTA-groen (klant).
- **P1** Juridische teksten, geverifieerde reviews, Rotterdam-openingstijden, prijzen, WhatsApp-nummer (klant).

PR blijft **draft** zolang deze P0/P1's open zijn.
