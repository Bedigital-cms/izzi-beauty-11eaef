# IZZI Beauty — finalisatie masterchecklist

Status per item van de geconsolideerde implementatie-PR ([#12](https://github.com/Bedigital-cms/izzi-beauty-11eaef/pull/12)).

Legenda: **OPEN** · **IMPLEMENTED_IN_PR** (code/content op de branch) · **VERIFIED** (runtime getest op de PR-preview/lokaal) · **BLOCKED_ACCESS** (omgeving/toegang) · **BLOCKED_CUSTOMER** (klantbesluit/-data nodig) · **BLOCKED_PLATFORM** (wijziging in gedeelde plumbing/CMS/architecture nodig).

> Kernblokkades in deze runtime (bewijs in [runbook](./izzi-deployment-runbook.md)):
> 1. **`cms.bedigital.ai` TLS reset** (`SSL_ERROR_SYSCALL` / `net::ERR_CONNECTION_CLOSED`) — DNS+TCP ok, TLS geweigerd vanaf deze VM. Alle CMS-media (logo's, foto's) laden NIET; media-QA (§5) en CMS-publish/sync zijn geblokkeerd.
> 2. **Referentierepo's** `Be-digital-cms` en `bedigital-architecture` zijn niet uitgecheckt en niet kloonbaar (parent van `/workspace` niet-schrijfbaar). Site Contract/CMS-implementatie niet direct verifieerbaar.
> 3. **Commerce staat uit** (`NEXT_PUBLIC_COMMERCE_ENABLED=0`), geen sandbox-PSP/LearnDash — checkout/betaal/toegang-flows niet end-to-end testbaar.

## §1 Werkwijze & autorisatie
| Item | Status |
| --- | --- |
| Docs gelezen (CLAUDE/HANDOVER/ai-guide/MEDIA/README + PR + contentmodel) | VERIFIED |
| Werk in PR #12, logische commits, geen merge, geen push naar main | VERIFIED |
| Redactionele content op branch bewerken (geautoriseerd) | IMPLEMENTED_IN_PR |
| CMS-lees/schrijf/publish-pad verifiëren vóór wijzigen | BLOCKED_ACCESS (CMS onbereikbaar) |
| Referentierepo's leesbaar? | BLOCKED_ACCESS |

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
| 12 | Enkel `nl`, zichtbare prefix; geprefixte legacy-redirects | **BLOCKED_PLATFORM + VERIFIED (bug)**: `/nl/wenkbrauwen-haarlem` → **404** (bare `/wenkbrauwen-haarlem` → 308 `/haarlem`). `buildRedirects()` in `next.config.ts` (plumbing) expandeert bij één taal niet naar de geprefixte default-locale. Exacte patch in runbook |

## §5 Media & logo's (EERSTE technische prioriteit)
| Item | Status |
| --- | --- |
| Keten site `/media` → CMS-endpoint → opslag → bytes | **BLOCKED_ACCESS**: `/media/..` → 302 → `cms.bedigital.ai` → TLS-reset. Geen bytes. `naturalWidth=0` op alle CMS-beelden (incl. header/footer-logo) |
| Bewijs dat álle beelden laden (naturalWidth>0) | BLOCKED_ACCESS (kan pas na CMS-bereikbaarheid/preview) |

## §6 Bedrijfsdata, navigatie & knoppen
| Item | Status |
| --- | --- |
| E-mail → info@izzi-beauty.com (site/home/forms) | IMPLEMENTED_IN_PR + VERIFIED |
| Amsterdam behouden; Den Bosch niet actief | IMPLEMENTED_IN_PR (footer) + VERIFIED |
| Rotterdam adres/postcode/telefoon/openingstijden | **BLOCKED_CUSTOMER**: bronkandidaat Weena 95 / 3013 CH niet bevestigd; home.json toont eerlijk "Nog niet bekend" — geen verzonnen data live gezet |
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
| Contact/UWV/opleiding/vacature-flows compleet | PARTIAL: alleen `contact`-form gedefinieerd in `forms.json`; overige flows OPEN |
| Echte formulierontvangst testen (testmailbox) | BLOCKED_ACCESS (CMS-submit-endpoint onbereikbaar; dev-submit is geen acceptatietest) |
| GTM/CMP/GA4/Ads/Meta config | BLOCKED_ACCESS: alleen Salonized + WhatsApp in `integrations.json`; providers via CMS Integraties. Geen losse trackers toegevoegd |
| Legacy-URL-mapping + statuscodes | **IMPLEMENTED_IN_PR (analyse) + VERIFIED (steekproef)**: 301 legacy-URL's geïnventariseerd; 94 resolven, 18 hebben redirect, **53 missen**. `permanent:true` = **308** (geen 301). Zie mapping-doc |
| Kennisbank hoofdingang zonder artikelverlies + /blog/page/N | OPEN/BLOCKED_CUSTOMER (redirectstrategie-beslissing; zie manifest) |

## §10 Verbeteringen & eindvalidatie
| Item | Status |
| --- | --- |
| Scanbare programma's + eerstvolgende-opleidingen-overzicht met filters | OPEN (afh. echte slotdata/commerce) |
| Brochure-voorbeeld (1, template-akkoord eerst) | OPEN |
| Regressietests | IMPLEMENTED_IN_PR + VERIFIED (`pnpm test`, 8 checks) |
| typecheck/lint/build | VERIFIED (exit 0; 1 pre-existing lint-warning in next.config.ts) |
| Preview-QA met geladen media @360/390/768/1280/1440 | PARTIAL/BLOCKED_ACCESS: layout getest headless; media niet laadbaar in runtime |

## Samengevat P0/P1 die merge blokkeren
- **P0** Media/logo's laden niet (CMS TLS-reset) — §5 kan niet worden afgetekend.
- **P0** Commerce/checkout/online-cursus-toegang niet getest (commerce uit, geen sandbox/LearnDash).
- **P1** `/nl/`-geprefixte legacy-redirects → 404 (platform-plumbing fix nodig).
- **P1** Contrastbesluit CTA-groen (klant).
- **P1** Juridische teksten, geverifieerde reviews, Rotterdam-gegevens, prijzen, WhatsApp-nummer (klant).

PR blijft **draft** zolang deze P0/P1's open zijn.
