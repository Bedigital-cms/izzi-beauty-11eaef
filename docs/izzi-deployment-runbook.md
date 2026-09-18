# IZZI Beauty — uitvoerbaar runbook (data / tenant / deployment)

Geen secrets of persoonsgegevens in dit bestand of in Git. Dry-run vóór elke muterende stap. Voer geen productie-import, echte betaling, DNS-wijziging of mailcampagne uit zonder afzonderlijk akkoord.

## 0. Rollen / eigenaren (invullen door klant/platform)
| Taak | Eigenaar | Bevestigde reactietijd |
| --- | --- | --- |
| CMS-content publish (Content Editor) | _tbd_ | _tbd_ |
| Tenant-config (Integraties, i18n, commerce-flag) | _tbd (platform/superadmin)_ | _tbd_ |
| LearnDash cursus-activatie | _tbd_ | _tbd_ |
| Platform-plumbing (next.config redirects) | _tbd (BE Digital)_ | _tbd_ |

## 1. Content-publicatievenster & sync (branch ↔ CMS) — BLOCKED_ACCESS
De redactionele content in `content/**/*.json` wordt door de Content Editor als **hele bestanden** weggeschreven en bij publicatie naar de repo gecommit (auteurs `IZZI AI Agent` / `BE Digital Platform`). Risico: een CMS-publish tijdens/na deze PR **overschrijft** de branch-wijzigingen of geeft een merge-conflict.

> ⚠️ **Niet als uitvoerbare procedure aanbieden zonder bewijs.** De eerdere stap "laat het CMS na merge één keer publiceren zodat CMS-state = repo-state" is **verwijderd**: die is ongeverifieerd en kan **oude CMS-content juist over de nieuwe Git-content heen schrijven**. De synchronisatierichting (Git → editor of editor → Git), de aanwezigheid van concepten/caches los van Git, en de versie-/conflictcontrole van het CMS zijn in deze runtime **niet te verifiëren** (CMS onbereikbaar, referentierepo `Be-digital-cms` niet leesbaar — zie §7). Behandel dit onderdeel als **BLOCKED_ACCESS**.

Eerst te verifiëren (met een geautoriseerde CMS/testomgeving) vóór er een venster wordt gepland:
1. Waar leest de Content Editor de inhoud vandaan (Git-revisie, database, of cache)?
2. Bestaan er concepten/caches onafhankelijk van Git die publiceren zou terugschrijven?
3. Hoe wordt de nieuwe Git-versie veilig **in** de editor geladen (import/refresh) vóór publiceren?
4. Wat overschrijft "publiceren" precies, en in welke richting?
5. Welke versie-/conflictdetectie is aanwezig?

Pas ná die verificatie kan een expliciete synchronisatierichting + publicatievenster worden vastgelegd. **Schakel het CMS niet zelf uit.**

Vergelijk in elk geval vóór merge de branch-content met actuele `main` (`git fetch origin main && git diff origin/main -- content/`) en los verschillen editorieel op.

### Rollback — twee verschillende dingen, niet inwisselbaar
- **Deployment-rollback:** Vercel "Instant Rollback" naar de vorige deploy, of `git revert <merge-commit>`. Herstelt de *gepubliceerde code/site*, **niet** de CMS-/databasestaat.
- **Content/CMS/data-herstel:** het terugdraaien van content of tenant-/DB-wijzigingen gebeurt in het CMS/de database volgens hun eigen versiebeheer/back-up. Een deployment-rollback herstelt dit **niet** automatisch, en een content-herstel herstelt geen code. Bepaal en test beide paden apart met de eigenaren uit §0.

## 2. Tenant-config (NIET redactioneel — via geautoriseerde config-route)
Niet in de repo bewerken (CMS/tenant overschrijft). Uitvoeren in het CMS:
- **WhatsApp-nummer** (`Tenants → Integraties → WhatsApp`): `31612345678` → correcte zakelijke nummer (kandidaat `31611768881`, internationaal zonder `+`/spaties). **Eerst WhatsApp-geschiktheid van het nummer bevestigen.**
- **Effectieve formulierontvanger**: `forms.json.notificationEmail` wordt niet in code gebruikt; de echte ontvanger zet je server-side in het CMS/tenant-formulierconfig. Zet op `info@izzi-beauty.com` en test met een afgesproken testmailbox (From/Reply-To, transport). Dev-submit (default uit) is **geen** acceptatietest.
- **Tracking** (`Tenants → Integraties`): GA4/GTM/CMP/Ads/Meta ontbreken (alleen Salonized + WhatsApp actief). Toevoegen via Integraties/Site Contract — geen losse trackers in code. Test consent + booking/purchase-events; geen PII in tracking.
- **Salonized** knopkleur (`#ff0040`) staat los van de siteknoppen; laat de klant de gewenste widgetkleur bevestigen.

## 3. Geprefixte legacy-redirects — GEÏMPLEMENTEERD in PR12 (getest)
**Probleem (gereproduceerd):** `/nl/wenkbrauwen-haarlem` → **404** (moest 308 → `/nl/haarlem`). Bij één actieve taal emitte `buildRedirects()` in `next.config.ts` alleen de kale regel. De echte oude URL's zijn `/nl/<slug>/`.

**Status:** met expliciete autorisatie voor `next.config.ts` in de IZZI-repo is onderstaande wijziging **doorgevoerd in deze PR (PR12)** en **getest** (zie verificatie hieronder). Het blijft aan te raden dezelfde fix naar het template te spiegelen zodat andere tenants meeliften — dat is een apart platform-akkoord.

**Toegepaste wijziging** (`next.config.ts`, functie `buildRedirects`, in de `if (!enabled)`-tak):
```ts
if (!enabled) {
  // Eén actieve taal, maar met zichtbare prefix (hideDefaultPrefix=false) is de canonical /<def>/new.
  // Emit óók de geprefixte legacy-regel zodat /nl/oud niet 404't.
  const dest = hideDefaultPrefix ? r.destination : withLocale(r.destination, defaultLocale)
  if (!hideDefaultPrefix) {
    out.push({ source: prefixPath(defaultLocale, r.source), destination: dest, permanent })
  }
  out.push({ source: r.source, destination: dest, permanent })
  continue
}
```
**Verificatie (uitgevoerd, tenant-host):** `/nl/wenkbrauwen-haarlem` → 308 → `/nl/haarlem`; `/wenkbrauwen-haarlem` → 308 → `/nl/haarlem`; trailing slash + querystring behouden; `/nl/lip-blush` → 200 blijft; geen loop/dubbele prefix. Statuscode van `permanent:true` = **308** (geen 301).

Op basis hiervan zijn **15 inhoudelijk geverifieerde legacy-redirects** toegevoegd aan `content/redirects.json` (prefix-vrije `source`/`destination`), getest voor `/nl`-vorm, kale vorm, trailing slash en querystring. De midden-zekere mappings uit de [mapping-doc](./izzi-migration-inventory-and-mapping.md) §3b wachten op bevestiging.

## 4. Media (P0) — mediaketen nog niet te valideren vanaf deze runtime
**Vastgesteld:** een *verbindingsfout vanuit deze onderzochte runtime* — `cms.bedigital.ai` weigert de TLS-handshake (`SSL_ERROR_SYSCALL`; DNS→216.150.16.1 en TCP:443 ok), in de browser `net::ERR_CONNECTION_CLOSED`, `img.naturalWidth===0`.
**Niet vastgesteld:** de *uiteindelijke oorzaak van ontbrekende beelden bij echte bezoekers*. De TLS-reset bewijst NIET dat opslag, CMS-records, tenantmapping of media-import fout zijn; het bewijst alleen dat déze runtime het CMS-endpoint niet bereikt.
**Nog te testen (waar geautoriseerd):** de volledige keten op een omgeving die het CMS kan bereiken — lokale site-media-URL, dezelfde URL op de **echte PR-preview** (Vercel; niet geverifieerd — geen bewijs dat Vercel de bytes wél haalt), direct CMS-media-endpoint, en de uiteindelijke opslagrespons. Rapporteer per stap: statuscode, redirectketen, `Content-Type`, en of het bestand echt als afbeelding **decodeert** (`naturalWidth>0`). Verifieer ook de huidige opslagimplementatie (Supabase Storage vs oude R2) in `Be-digital-cms` — niet aannemen.

Remediatie-opties (platform):
- Sta egress naar `cms.bedigital.ai` toe vanaf de agent-/buildomgeving, **of** test op de Vercel-preview **zodra/als die omgeving de media-endpoint daadwerkelijk kan bereiken** (nu niet geverifieerd — geen aanname dat Vercel het CMS wél haalt).
- Verifieer de huidige opslagimplementatie (Supabase Storage vs oude R2) in `Be-digital-cms`.
- Herstel/import ontbrekende beelden via de ondersteunde tenant-veilige media-import (bytes + DB-record; MEDIA.md), met bronmapping + checksums. Geen stockbeelden, geen hotlinks, geen versoepelde publieke rechten.
- Aftekenen pas met bewijs: elk gebruikt beeld `naturalWidth>0`, juiste crop/onderwerp, zinvolle alt.

## 5. Commerce / LearnDash (onderdeel van deze release; runtime-aftekening later in deze PR)
Blijft binnen dezelfde geconsolideerde IZZI-finalisatie — de runtime-/sandbox-uitvoering wordt afgetekend zodra PSP/LearnDash-toegang beschikbaar is, niet als losstaande sprint. Niet activeren zonder akkoord. Dry-run/sandbox vereist:
- Commerce-flag/PSP (Mollie) sandbox; verifieer in3-toelating + limieten (EUR50–5000, geen acceptatiegarantie) — niet beloven per dure opleiding; geen kunstmatige transactiesplitsing.
- Product/variant-handles ↔ oude SKU's ↔ LearnDash-cursus (mapping-doc §7 invullen; geen fictieve ID's).
- Test end-to-end: cursus → datum/locatie → plaats → mandje → betaling → order → bevestigingsmail → toegang. Plus dubbelklik, herhaalde events, pending/weigering/annuleren, bedragmismatch, (deel)refund, beperkte voorraad. Betaalstatus alleen server-side via PSP-verificatie (geen return-url/browserinput). Voorkom de oude nulbedrag/aanbetalingsfout.
- LearnDash-overdracht: order → interne taak → klantmail → activatie → juiste cursus; leg subdomein/login/reset + cursusafhankelijke toegang vast. Geen claim van directe automatische toegang als die ontbreekt.

## 6. Vercel (read-only)
Alleen-lezen inspectie van de drie IZZI Vercel-projecten (builds/logs/preview). **Niets verwijderen.** Geen productie-DNS-wijziging. Merge pas na akkoord; PR blijft draft zolang P0/P1 open zijn.
