# IZZI Beauty — Launch Blocker Action Pack

Voor: Barry / IZZI. Doel: exact weten welke **informatie, toegang en beslissingen** nog nodig zijn om NL live te zetten en daarna Engels te activeren.

Bron (niet herschreven): [`PRE_LIVE_READINESS.md`](PRE_LIVE_READINESS.md), [`izzi-en-services-medical-review.md`](izzi-en-services-medical-review.md), [`izzi-en-trainings-review.md`](izzi-en-trainings-review.md), [`izzi-en-blog-review.md`](izzi-en-blog-review.md).  
Stand: `main` `5e21cdb` (gemergde pre-live PR #15). Datumcontext reviews: **september 2026**.

**Dit document vult geen klantbeslissingen in.** Waar een keuze nodig is, staat alleen de vraag en de gewenste antwoordvorm.

Geen EN-activatie, geen DNS, geen echte Mollie-livebetaling vanuit dit pack.

Prioriteit (elk item precies één):

| Code | Betekenis |
|---|---|
| **P0** | Blokkeert NL-livegang |
| **P1** | Blokkeert EN-activatie (NL mag live als IZZI dat accepteert) |
| **P2** | Mag direct na live |

---

## Aanbevolen uitvoervolgorde

1. Klantbeslissingen ophalen (lijst A — start met P0).
2. CMS / media / integraties invullen (alleen goedgekeurde waarden).
3. Forms E2E (T1–T4).
4. Mollie **sandbox** (T8–T15). Geen live-Mollie.
5. LearnDash-handoff (C39–C41 + T16–T18).
6. Real-browser / mobile QA (T19–T23).
7. Legal final in CMS (C1–C7) + noindex pas uitzetten ná goedkeuring.
8. Final bilingual activation rehearsal (tijdelijke config, niet committen).
9. DNS / cutover (F18–F19).
10. EN activation slot-PR (aparte PR; niet dit document).

---

## A. Customer decisions

Eén vraag per rij. Zelfde feiten die op meerdere pagina’s staan (CRKBO, UWV, zwangerschap, pijn, heling) zijn **niet** opnieuw als losse vraag gesteld: het toepassingsvlak staat bij de huidige situatie.

| # | Onderwerp | P | NL live? | EN? | Huidige situatie | Exacte vraag aan klant | Aanbevolen antwoordvorm |
|---|---|---|---|---|---|---|---|
| C1 | Definitieve bedrijfsentiteit | P0 | ja | ja | Legal-placeholder; opleidingsteksten noemen o.a. IZZI Beauty BV. Twee namen circuleren (IZZI Beauty BV vs Opleiding IZZI Beauty BV). KvK ontbreekt in goedgekeurde legal. | Welke rechtspersoon(en) staan op AV, privacy, factuur en opleidingen? KvK-nummer? | Eén of twee officiële namen + KvK + waar welke entiteit geldt. |
| C2 | Algemene voorwaarden | P0 | ja | ja | `/algemene-voorwaarden` = voorbeeldtekst, `noindex`, niet in sitemap. `content/en/legal.json` ontbreekt. | Lever goedgekeurde NL-AV (behandelingen). EN alleen als advocaat/IZZI die aanlevert. | CMS-tekst of PDF-bron. Niet laten schrijven door agent. |
| C3 | Privacyverklaring | P0 | ja | ja | Placeholder (“vervang deze door je eigen privacyverklaring”), noindex. | Lever goedgekeurde privacy (doeleinden, verwerkers, rechten, bewaartermijnen, Salonized, Laliqa/shop, formulieren). | Goedgekeurde NL (+ optioneel EN). Lijst verwerkers aanvinken. |
| C4 | Opleidingenvoorwaarden | P0 | ja | ja | Placeholder over certificaat, noindex. | Lever goedgekeurde opleidingenvoorwaarden (annulering, aanbetaling, toegang academy, examen). | Goedgekeurde NL (+ optioneel EN). |
| C5 | Klachtenprocedure | P0 | ja | ja | Zit niet als goedgekeurde tekst in legal. | Hoe luidt de klachtenprocedure en waar publiceert IZZI die? | Korte goedgekeurde procedure + URL/pagina. |
| C6 | Correcte adressen in legal | P0 | ja | ja | Live content: Amsterdam Koningin Wilhelminaplein **13**, 1062 **HH**; Rotterdam Weena **95**, 3013 **CH**. Oude legal-drafts noemden KWP 1 / 1062 HG — niet gebruiken. | Bevestig dat legal uitsluitend 13 / 1062 HH en Weena 95 / 3013 CH mag gebruiken. | “Bevestigd” of gecorrigeerde officiële adressen. Geen nieuwe adressen verzinnen. |
| C7 | Cookies in legal | P0 | ja | ja | Geen goedgekeurde cookietekst. CMP-product = C45 (niet hier). | Welke cookietekst hoort in de privacy/AV? | Goedgekeurde alinea + of marketingcookies pas ná consent. |
| C8 | Actuele opleidingsprijzen | P0 | ja | ja | Prijzen/termijnen in `trainings-detail` (o.a. €3.000 / €3.400). Bron niet geverifieerd t.o.v. huidige Woo/CMS-catalogus. | Zijn de getoonde prijzen de actuele 2026-prijzen? | Per opleiding: actueel bedrag of “pagina X aanpassen naar €…”. |
| C9 | Actuele startdata | P0 | ja | ja | Data in content niet als actueel bewezen. | Welke startdata mogen online? | Lijst per opleiding of “haal data weg tot CMS-agenda live is”. |
| C10 | Opleidingslocaties | P0 | ja | ja | Amsterdam / Rotterdam / online in copy. Review: handmatig bevestigen. | Welke opleiding waar (AMS / RTM / online)? | Tabel opleiding → locatie. |
| C11 | Verlopen acties | P0 | ja | ja | O.a. PMU-machine cadeau **t/m augustus 2026** terwijl context september 2026 is. | Welke acties zijn nu geldig? | Per actie: live laten t/m datum / stoppen / nieuwe tekst. |
| C12 | Machine- / startpakketwaardes | P0 | ja | ja | O.a. machine t.w.v. €550, academy/startpakket t.w.v. €1.250. | Kloppen deze waardes nog? | Per bedrag: bevestigen of nieuw bedrag. |
| C13 | Betaaltermijnen | P0 | ja | ja | Tabellen met aanbetaling + 2/4/6 termijnen op meerdere opleidingen. | Zijn de termijntabellen actueel en volledig? | Per opleiding: schema of “verwijder termijnen, alleen in3/Mollie”. |
| C14 | in3 / BKR-tekst | P0 | ja | ja | Copy: termijnen zonder rente / zonder BKR. Mollie in3 is een kredietproduct. | Mag “geen BKR / geen rente” zo blijven, of alleen voor IZZI-termijnen (niet in3)? | “Behouden voor eigen termijnen” / “herschrijven” + goedgekeurde zin. |
| C15 | CRKBO / btw-vrij | P0 | ja | ja | “CRKBO-erkend” + “btw-vrij” op opleidingen én in blog (o.a. Lucky 8, All Round-artikel). | Is de erkenning actueel en mag “btw-vrij dankzij CRKBO” zo? | Ja + geldig tot / nee + vervangende formulering. Eén antwoord, toepassen op opleidingen + blog. |
| C16 | Lifetime vs 90 dagen academy | P0 | ja | ja | Meerdere pagina’s: “levenslang” / “voor altijd”. Repo provisiont niet automatisch. | Wat is de echte toegangstermijn? | “Lifetime” of “90 dagen” of andere termijn + welke pagina’s. |
| C17 | UWV / WW / WIA / Wajong | P0 | ja | ja | “UWV-subsidie mogelijk” op opleidingen + blogverwijzingen. | Voor welke opleidingen is UWV nu mogelijk? | Lijst ja/nee per opleiding; zo nee: tekst weg. |
| C18 | All Round-programma | P1 | nee | ja | Huidige NL vertaald; oude WP-uren niet teruggezet. Inhoud niet herrekend. | Is All Round (dagen, modules, prijs) actueel? | Bevestigen of CMS-correctie. |
| C19 | Guest trainer Linda Goldman | P1 | nee | ja | `fineline-masterclass`: “Linda Goldman & Isabella Levels”. Team live = Isabella + Carla. | Geeft Linda deze masterclass nog? | “Ja, laten staan” / “alleen Isabella” / andere naam. |
| C20 | Duur / planning opleidingen | P1 | nee | ja | Duration/location niet automatisch inconsistent; 2026-planning niet bewezen. | Kloppen lesduur en dagindeling? | Per opleiding bevestigen of corrigeren. |
| C21 | Painless-claims | P1 | nee | ja | 16 NL-behandelpagina’s + EN-vertaling + blog. Review: 39 “painless”-zinnen. Zelfde claim als NL. | Mogen absolute “pijnloos / volledig pijnloos” blijven? | Behouden / afzwakken tot “meestal mild” / per behandeling markeren. Eén beleid, ook blog. |
| C22 | Scarring / geen huidschade | P1 | nee | ja | “Geen littekenweefsel”, “geen schade aan de huid” op o.a. laser, PMU, micro-haar. | Mogen deze absoluten blijven? | Behouden / nuanceren / schrappen. |
| C23 | Every skin type | P1 | nee | ja | “Geschikt voor ieder/alle huidtype(s)” o.a. laser, powder brows, microblading-vergelijking. | Mag “alle huidtypes” blijven? | Behouden / “vrijwel alle, intake beslist”. |
| C24 | Zwangerschap | P1 | nee | ja | Contra-indicatie in behandel- + blogteksten (`permanente-make-up-zwangerschap`, e.d.). | Wat is het officiële beleid? | Eén zin: niet behandelen / alleen met artsverklaring / anders. Toepassen op services + blog. |
| C25 | Medicatie / bloedverdunners | P1 | nee | ja | Stoptermijnen verschillen (24 u laser vs 48 u lip vs “dag van behandeling” combi). | Wat is het officiële voorschrift? | Eén schema (middel → stoptermijn) of “volgt intake, haal stellige uren weg”. |
| C26 | Healing / recovery / nazorg | P1 | nee | ja | Helingsdagen, 6–8 weken touch-up, 40–60% fade in services + blog (114 aftercare-flags). | Welke herstel-/nazorgclaims blijven? | Behouden / herschrijven / “volgt nazorgkaart”. |
| C27 | Garanties | P1 | nee | ja | “Garanderen resultaat / veiligheid / kwaliteit” in o.a. powder-brows-pijn FAQ. | Welke garantie belooft IZZI wettelijk? | Geen resultaatgarantie / alleen hygiëne / andere goedgekeurde zin. |
| C28 | Laser-absoluten | P1 | nee | ja | Tattoo-laser: geen litteken, geen kale plekken; PRE_LIVE noemt ook “all colours” / “disappears completely” als te bevestigen. | Welke laserclaims blijven? | Behouden / nuanceren (niet alle inkt, geen 100% weg). |
| C29 | Minimumleeftijd | P1 | nee | ja | Blog: niet jonger dan 16 of zwanger. | Wat is de minimumleeftijd (behandeling vs opleiding)? | Getal + uitzondering (gezag) of “volgt wet, tekst aanpassen”. |
| C30 | Lucky 8 / €800 | P0 | ja | ja | Artikel `lucky-8-800-korting-op-een-beginnersopleiding` presenteert €800 korting. | Is Lucky 8 nog actief? | Stoppen (noindex/archiveren) / nieuwe einddatum / andere actie. |
| C31 | REACH 2022 | P1 | nee | ja | Artikel `pmu-reach-regelement-2022` + pigmentclaims “REACH-conform”. | Is de REACH-uitleg nog juist? | Bevestigen / laten updaten door IZZI (geen agent-herschrijving). |
| C32 | GGD-claims / tarieven | P1 | nee | ja | O.a. €324,67 + €108,22/uur in GGD-artikel; “GGD-goedgekeurd”-advies op veel posts. | Kloppen tarieven en keuringsclaims nog? | Actuele GGD-bedragen of “haal bedragen weg”. |
| C33 | Prijsbenchmarks blog | P1 | nee | ja | Lip €300–€600, powder €200–€750, laser PMU €75–€150, advies faux freckles €150–€250. | Mogen deze marktprijzen blijven? | Behouden / actualiseren / verwijderen. |
| C34 | Review-aantallen | P1 | nee | ja | O.a. “honderden 5-sterren”, “meer dan 350”, “duizenden behandelingen”. | Welk actueel aantal mag IZZI noemen? | Exact cijfer + bron + datum, of claims schrappen. |
| C35 | Oude locaties in blog | P1 | nee | ja | PRE_LIVE: oude locatieclaims in kennisbank. Live salonadressen staan in site/contact. | Welke artikelen noemen een verouderd adres? | Lijst “aanpassen naar 13 / Weena 95” of “geen oude locatie gevonden, OK”. IZZI markeert. |
| C36 | Rotterdam opening hours | P2 | nee | nee | Uren leeg met opzet. Niet verzonnen. | Wat zijn de Rotterdam-uren, of bewust leeg laten? | Tijdschema of “leeg laten tot bekend”. |
| C37 | `/rotterdam` location card | P2 | nee | nee | Service-area “Wenkbrauwen Rotterdam”; location-blok is **Amsterdam**. Footer heeft Weena 95. FAQ: studio AMS + locatie RTM. Geen fake-studio-bug. | Moet `/rotterdam` Weena 95 tonen of bewust Amsterdam blijven? | “Weena 95-kaart” / “Amsterdam service-area laten”. Geen uren verzinnen. |
| C38 | WhatsApp-nummer | P0 | ja | ja | Widget `31612345678` (placeholder). Publiek telefoon in content: `+31 6 11 76 88 81`. **Niet aannemen dat dat WhatsApp is.** | Wat is het echte WhatsApp-nummer? | Cijfers zonder aanname, via CMS → Integraties. |
| C39 | LearnDash login-URL | P0 | ja | ja | Geen academy-login in content. Repo provisiont niet. | Wat is de definitieve login/subdomain-URL? | Volledige `https://…` URL + of die op de site mag. |
| C40 | Manual access handoff | P0 | ja | ja | Launchmodel = e-mail/ops ná aankoop. | Wie geeft toegang, binnen welke termijn, met welk bewijs? | Rol + SLA (bijv. “binnen 1 werkdag, mail X”). |
| C41 | Copy “direct toegang” | P0 | ja | ja | Meerdere opleidingen: “direct toegang” / “na aanbetaling direct toegang”. Tech: handmatig. | Mag die copy blijven? | “Ja, want ops doet het dezelfde dag” / “nee, herschrijf naar ‘toegang na bevestiging per mail’”. |
| C42 | CTA-contrast | P2 | nee | nee | Groen `#21D19F` + witte knoptekst (~1.97:1). Eerder zo gekozen. | Welke optie? | **A** groen + donkere tekst · **B** wit-op-groen bewust accepteren · **C** ander goedgekeurd groen (hex). |
| C43 | GTM-ID | P2 | nee | nee | Geen GTM in `integrations.json`. Niet in pagina’s plakken. | Willen jullie GTM? Zo ja, welk ID? | `GTM-XXXX` of “geen GTM”. Alleen via CMS → Integraties. |
| C44 | GA4 via GTM | P2 | nee | nee | Geen GA4. Salonized heeft legacy `UA-177261363-3`. | GA4 via GTM ja/nee? Measurement-ID? | Ja + ID / nee. UA niet als GA4 behandelen. |
| C45 | CMP / CookieFirst | P1 | nee | ja | Oude site CookieFirst; tenant heeft **geen** CMP. PRE_LIVE: bevestigen vóór EN-indexatie. | Welke CMP, of bewust geen CMP? | CookieFirst / andere + IDs / “geen CMP, alleen essentiële”. |

**Customer decisions: 45.** Geen antwoorden ingevuld.

---

## B. Access / E2E tests

Geen copy-beslissing. Alleen bewijs met de juiste toegang. Geen live-Mollie.

| # | Test | P | Benodigde toegang | Exact scenario | Verwacht resultaat | Bewijs | PASS-criteria |
|---|---|---|---|---|---|---|---|
| T1 | Formulier `contact` | P0 | Productie-CMS + gecontroleerde mailbox (`info@` of testinbox) | 1× geldig versturen vanaf `izzi-beauty.localhost` of preview-host; 1× expres ongeldig; 2× snel dezelfde geldige set | Succespad bevestiging; foutpad geen stille 200; geen 2 mails | Screenshot + mail + request-id/tijd | 1 mail, fout zichtbaar, geen duplicate |
| T2 | Formulier `uwv` | P0 | Zelfde + UWV-formulier in CMS | Zelfde drie paden; `opleiding_specifiek` blijft hangen als de pagina die meestuurt | Mail bevat de gekozen opleiding | Screenshot + mail | Zelfde als T1 + opleiding in body |
| T3 | Formulier `opleiding-interesse` | P0 | Zelfde | Zelfde drie paden vanaf een opleiding/online-kaart | Prefill/cursus in de mail | Screenshot + mail | Zelfde als T1 + juiste cursus |
| T4 | Formulier `vacature` | P0 | Zelfde; CV blijft e-mail (geen upload) | Succes (tekstvelden); fout leeg; geen dubbel | Instructie CV naar `info@izzi-beauty.com`; 1 formuliermail | Screenshot + mail | Geen file-upload-crash; 1 mail; foutpad werkt |
| T5 | Media Isabella | P0 | CMS → Media, tenant `izzi-beauty` | Upload definitieve teamfoto Isabella; ref in `info.json` ons-team | Teamkaart toont foto, geen placeholder | CMS-bestandsnaam + screenshot team | `naturalWidth > 0` in echte browser |
| T6 | Media Carla | P0 | Zelfde | Zelfde voor Carla | Zelfde | Zelfde | Zelfde |
| T7 | Hero/media QA | P0 | Vercel preview + echte browser | Homepage, Powder Brows, All Round, lang blog, locaties, team: img `naturalWidth > 0` | Geen gebroken heroes | Tabel pagina → width + screenshot | Alle gekozen heroes > 0 |
| T8 | Mollie sandbox — betaalde training | P0 | Vercel `COMMERCE_API_KEY` + Mollie **test** + 1 sandbox-opleiding | Koop 1 betaalde training, bedrag > €0 | Mollie Checkout → paid → bedankt | Ordernr + sandbox payment-id + bedrag | Geen live-key; totalCents > 0; status paid |
| T9 | Mollie sandbox — aanbetaling | P0 | Zelfde | Training mét deposit (als catalogus die heeft) | Aanbetaling ≠ €0; rest volgt productregels | Payment-id + orderregels | Deposit > 0; geen €0-session |
| T10 | Mollie sandbox — cancelled | P0 | Zelfde | Start betaling, annuleer bij Mollie | Order niet paid; winkelwagen bruikbaar | Screenshot cancelled + orderstatus | Geen “bedankt alsof betaald” |
| T11 | Mollie sandbox — in3 in range | P0 | Zelfde + in3 in test | Bedrag binnen CMS-in3-grenzen, kies in3 | Mollie toont in3; geen 422 zonder adres | Payment-id + gekozen method | in3 alleen binnen grenzen; buiten range geen stille optie |
| T12 | Zero-payment guard | P0 | Zelfde of preview | Forceer/simuleer `totalCents <= 0` | API `ZERO_PAYMENT`; knop disabled; geen Mollie-session | Response-JSON + screenshot knop | Geen checkoutUrl; code `ZERO_PAYMENT` |
| T13 | Orderstatus | P0 | Zelfde | Na T8 status pollen op bedankt/account | paid/pending/failed klopt | Screenshot + API-status | Geen valse paid |
| T14 | Return URL | P0 | Zelfde | Afronden vanuit `/nl/afrekenen` (en later EN-rehearsal) | Terug op locale-aware `/afrekenen/bedankt` | Redirect-keten | Geen dode `/checkout/bedankt`; geen geforceerde `/en/…` bij hideDefaultPrefix |
| T15 | Bevestigingsmail commerce | P0 | Mollie/CMS-mail + testinbox | Na T8 | Klantmail met ordernr, geen “direct academy” tenzij C41 ja is | Mailbestand | 1 mail, juiste bedrag/taal |
| T16 | LearnDash login bereikbaar | P0 | URL uit C39 + account | Open login-URL | 200 login, geen old-host 404 | Screenshot URL-balk | HTTPS, verwacht login-scherm |
| T17 | Handmatige toegang na order | P0 | Ops + LearnDash-admin | Na T8: voer C40 uit | Cursist kan inloggen op gekochte modules | Ticket/tijd + screenshot in academy | Binnen afgesproken SLA |
| T18 | Academy-bevestiging | P0 | Zelfde mailbox | Controleer wat de klant na aankoop krijgt | Mail/copy = C40/C41, geen automatische magie | Mail | Geen “direct provisioned” als dat niet zo is |
| T19 | Real browser mobile 360/390/430 | P0 | Vercel preview | Home, mega menu, behandeling, opleiding, prijzen, contact, team, kennisbank, locaties, forms | Geen overflow, CTA wrap OK, accordion werkt | 3 viewports × kernpagina’s screenshots | Geen horizontale scroll op kernpaden |
| T20 | Real browser desktop | P0 | Zelfde | 1280: home, mega, checkout (als commerce aan) | Header/mega/checkout leesbaar | Screenshots | Geen afgekapte mega/CTA |
| T21 | Real browser media | P0 | Zelfde + CMS-media | Zelfde set als T7 op preview | Beelden laden | naturalWidth-log | T7 PASS op preview-URL |
| T22 | Real browser forms | P0 | Zelfde als T1–T4 | Eén succespad per formulier op preview | = T1–T4 | Zelfde | T1–T4 PASS |
| T23 | Real browser checkout + language switcher | P0 | Commerce sandbox + preview | Checkout NL; switcher NL↔EN alleen ná activatie-rehearsal | Geen €0; switcher geen `/en` als EN default | Screenshots | Guard blijft; switcher volgens `hideDefaultPrefix` |
| T24 | GTM firing | P2 | C43 ja + preview | Tag Assistant op preview | GTM laadt ná (of met) consent-regels | Tag Assistant export | Container-ID = C43; geen hardcoded snippet in pages |
| T25 | Consent vóór marketing | P1 | C45 gekozen + preview | Eerste bezoek: weigeren, daarna accepteren | Geen marketingpixel vóór accept | Network-HAR | Geen GTM-marketing/ads vóór consent (essentieel mag) |
| T26 | GA4 events | P2 | C44 ja | page_view + form submit + (optioneel) purchase sandbox | Events in GA4 DebugView | DebugView-screenshot | Geen UA-hits als GA4 de bron is |
| T27 | Salonized widget | P1 | Preview | Open contact/boeking | Widget company `PrfWgEYr3WZagmd43yvLqWpL`, taal nl | Screenshot | Widget zichtbaar; geen extra UA-besluit hier (C44) |
| T28 | WhatsApp widget | P0 | C38 ingevuld in CMS | Klik widget | `wa.me` = bevestigd nummer, niet `31612345678` | Screenshot + URL | Nummer = C38 |

**Access tests: 28.**

---

## C. Technical final checks

Afvinken door platform/agent **nadat** A/B-blockers opgelost of bewust geaccepteerd zijn. Geen nieuwe features.

| # | Check | P | Wat doen | PASS |
|---|---|---|---|---|
| F1 | Production domain env | P0 | Vercel: `NEXT_PUBLIC_SITE_URL=https://izzi-beauty.com` (en forms/commerce-env aanwezig) | Env komt overeen met live host |
| F2 | Canonical origin | P0 | Home + 3 inner pages: canonical host `izzi-beauty.com` | Geen preview-host in canonical |
| F3 | Final redirects | P0 | Legacy-lijst in `next.config.ts` + oude WP-paden | 301 naar bestaande route, geen kettinglus |
| F4 | 404s | P0 | Onbekende slug + globale 404 | `ui.notFound`, geen harde NL-only 404 na EN-rehearsal |
| F5 | Sitemap | P0 | Productie: 132 NL, 0 legal, 0 drafts. Ná EN: 264, 0 `/en` | Telt + uitsluitingen kloppen |
| F6 | Robots | P0 | Legal noindex tot C2–C4 live; functional `/account` `/preview/` `/winkelwagen` `/afrekenen` `/order/` + `/*/` | Geen index op placeholders/functional |
| F7 | Reciprocal hreflang | P1 | Per paar EN-root ↔ `/nl/…` + `x-default` = default locale | Wederkerig, geen `/en/…` als EN default |
| F8 | `/en` → clean root | P1 | Rehearsal: `/en`, `/en/blog` 301 zonder query-verlies | Geen loop (`/en/` 308→`/en`→301 `/` is OK) |
| F9 | EN root / NL `/nl` | P1 | `/` + `/blog` = `lang=en`; `/nl` + `/nl/blog` = `lang=nl` | Alleen ná activatie-config |
| F10 | Legal noindex tot approved | P0 | Drie legal routes `index:false` totdat C2–C4 in CMS staan | Geen sitemap-URL legal vóór OK |
| F11 | Zero-payment guard | P0 | Code + T12 | `ZERO_PAYMENT` + client `totalCents <= 0` |
| F12 | Geen €0-aankoop | P0 | Catalogus + T8/T9 | Geen Woo-deposit-€0 |
| F13 | Forms config | P0 | `content/forms.json` slugs + `NEXT_PUBLIC_FORMS_ENDPOINT` | T1–T4 mogelijk |
| F14 | Integrations config | P0 | CMS Integraties: WhatsApp=C38; GTM/CMP alleen als C43/C45 | Geen `31612345678`; geen snippets in pages |
| F15 | Mobile sweep sign-off | P0 | T19–T23 gedaan | Checklist afgevinkt |
| F16 | Lighthouse / performance sanity | P2 | Home + 1 behandeling + 1 opleiding op preview | Geen rode LCP door kapotte media; geen runtime-CSS-in-JS |
| F17 | Rollback plan | P0 | Documenteer: Vercel previous deployment; DNS niet wijzigen zonder rollback-host | Eigenaar + stappen bekend vóór cutover |
| F18 | Old-provider dependencies | P0 | Inventaris: oude host, oude LearnDash-domein, CookieFirst, UA, Woo | Elk: blijft / redirects / uitzetten |
| F19 | DNS cutover checklist | P0 | A/AAAA/CNAME naar Vercel; apex + www; mail MX ongemoeid; TTL-plan | DNS **niet** in een content-PR |
| F20 | Post-live checks | P2 | Na cutover: home 200, sitemap, 1 form, 1 sandbox-of-kleine live-proof volgens IZZI, Search Console later | Geen stille 404 op kernnav |

**Technical checks: 20.**

`content/i18n.json` blijft tot de slot-PR: `enabled:false`, `defaultLocale:nl`, `locales:[nl]`, `hideDefaultPrefix:false`.

---

## Counts

| Set | Aantal |
|---|---|
| A Customer decisions | 45 |
| B Access / E2E | 28 |
| C Technical final | 20 |
| **P0** (A+B+C) | **61** |
| **P1** | **23** |
| **P2** | **9** |

P0 in A: C1–C17, C30, C38–C41 (22).  
P1 in A: C18–C29, C31–C35, C45 (18).  
P2 in A: C36, C37, C42–C44 (5).  
P0 in B: T1–T23, T28 (24). P1 in B: T25, T27 (2). P2 in B: T24, T26 (2).  
P0 in C: F1–F6, F10–F15, F17–F19 (15). P1 in C: F7–F9 (3). P2 in C: F16, F20 (2).

---

## Top 10 next actions

1. IZZI: C1–C7 legal + adressen (P0).
2. IZZI: C8–C17 + C30 + C41 prijzen, acties, toegang, CRKBO/UWV, Lucky 8 (P0).
3. IZZI: C38 WhatsApp-nummer in CMS Integraties (P0).
4. IZZI: C39–C40 LearnDash-URL + handoff-SLA (P0).
5. IZZI: T5–T6 teamfoto’s Isabella/Carla (P0).
6. Platform: T1–T4 forms E2E naar gecontroleerde mailbox (P0).
7. Platform: T8–T15 Mollie **sandbox** + T12 zero-payment (P0).
8. Platform + IZZI: T16–T18 academy-handoff bewijzen (P0).
9. Platform: T19–T23 + F15 real-browser/mobile (P0).
10. Daarna P1-bundel (medisch/blog/CMP) → rehearsal F7–F9 → F19 DNS → EN slot-PR.

---

## NEW_TECHNICAL_BLOCKER

Geen nieuw technisch defect gevonden tijdens deze documentatie-inventarisatie. Geen stille codefix gedaan.

Bekend en al in PRE_LIVE (geen nieuw blocker): `/ervaringen` 404 zonder content-key; legal placeholders; commerce lokaal uit; EN uit.

---

## Wat dit pack niet is

- Geen EN-activatie, geen DNS-wijziging, geen live-betaling.
- Geen herschreven medische/juridische/prijs-copy.
- Geen aangenomen WhatsApp-nummer, uren, GTM-ID of CRM-feiten.
- Implementatie van C/T/F gebeurt in latere, aparte PRs ná IZZI-akkoord.
