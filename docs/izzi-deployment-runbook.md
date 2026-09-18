# IZZI Beauty — uitvoerbaar runbook (data / tenant / deployment)

Geen secrets of persoonsgegevens in dit bestand of in Git. Dry-run vóór elke muterende stap. Voer geen productie-import, echte betaling, DNS-wijziging of mailcampagne uit zonder afzonderlijk akkoord.

## 0. Rollen / eigenaren (invullen door klant/platform)
| Taak | Eigenaar | Bevestigde reactietijd |
| --- | --- | --- |
| CMS-content publish (Content Editor) | _tbd_ | _tbd_ |
| Tenant-config (Integraties, i18n, commerce-flag) | _tbd (platform/superadmin)_ | _tbd_ |
| LearnDash cursus-activatie | _tbd_ | _tbd_ |
| Platform-plumbing (next.config redirects) | _tbd (BE Digital)_ | _tbd_ |

## 1. Content-publicatievenster & sync (branch ↔ CMS)
De redactionele content in `content/**/*.json` wordt door de Content Editor als **hele bestanden** weggeschreven en bij publicatie naar de repo gecommit (auteurs `IZZI AI Agent` / `BE Digital Platform`). Risico: een CMS-publish tijdens/na deze PR **overschrijft** de branch-wijzigingen of geeft een merge-conflict.

Procedure (kort publicatievenster):
1. **Vergelijk vóór merge** de branch-versies van `content/nl/site.json`, `content/nl/home.json`, `content/forms.json` met de actuele `main`/CMS-content (`git fetch origin main && git diff origin/main -- content/`). Los verschillen editorieel op.
2. Kies een venster waarin de klant **niet** publiceert.
3. Merge de PR (na akkoord) en laat Vercel bouwen; controleer de preview.
4. Direct daarna: laat het CMS één keer publiceren/synchroniseren zodat CMS-state = repo-state. **Schakel het CMS niet zelf uit.**
5. Verifieer dat de gepubliceerde nav/footer/e-mail overeenkomen (`pnpm test` als snelle regressiecheck).

Rollback: `git revert <merge-commit>` (of Vercel "Instant Rollback" naar de vorige deploy). Content-only rollback: herstel de vorige `content/**`-bestanden en laat het CMS opnieuw publiceren.

## 2. Tenant-config (NIET redactioneel — via geautoriseerde config-route)
Niet in de repo bewerken (CMS/tenant overschrijft). Uitvoeren in het CMS:
- **WhatsApp-nummer** (`Tenants → Integraties → WhatsApp`): `31612345678` → correcte zakelijke nummer (kandidaat `31611768881`, internationaal zonder `+`/spaties). **Eerst WhatsApp-geschiktheid van het nummer bevestigen.**
- **Effectieve formulierontvanger**: `forms.json.notificationEmail` wordt niet in code gebruikt; de echte ontvanger zet je server-side in het CMS/tenant-formulierconfig. Zet op `info@izzi-beauty.com` en test met een afgesproken testmailbox (From/Reply-To, transport). Dev-submit (default uit) is **geen** acceptatietest.
- **Tracking** (`Tenants → Integraties`): GA4/GTM/CMP/Ads/Meta ontbreken (alleen Salonized + WhatsApp actief). Toevoegen via Integraties/Site Contract — geen losse trackers in code. Test consent + booking/purchase-events; geen PII in tracking.
- **Salonized** knopkleur (`#ff0040`) staat los van de siteknoppen; laat de klant de gewenste widgetkleur bevestigen.

## 3. Platform-plumbing fix (P1) — geprefixte legacy-redirects
**Probleem (gereproduceerd):** `/nl/wenkbrauwen-haarlem` → **404** (moet 308 → `/nl/haarlem`). Bij één actieve taal emit `buildRedirects()` in `next.config.ts` alleen de kale regel. De echte oude URL's zijn `/nl/<slug>/`.

**Voorgestelde patch** (`next.config.ts`, functie `buildRedirects`, in de `if (!enabled)`-tak) — vereist platform-akkoord (plumbing/CLAUDE.md):
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
**Verificatie na patch:** `pnpm build` en dan (op de tenant-host) `/nl/wenkbrauwen-haarlem` → 308 → `/nl/haarlem`; `/wenkbrauwen-haarlem` → 308 → `/nl/haarlem`; `/nl/lip-blush` → 200 blijft. Spiegel de fix naar het template zodat andere tenants meeliften. Statuscode van `permanent:true` = **308** (rapporteer geen 301).

Pas hierna de §3-redirectvoorstellen uit [mapping-doc](./izzi-migration-inventory-and-mapping.md) toe in `content/redirects.json` (prefix-vrije `source`/`destination`), en test `/nl`-vorm, kale vorm, trailing slash en querystring.

## 4. Media (P0) — egress naar CMS
`cms.bedigital.ai` weigert TLS vanaf deze runtime (bewijs in mapping-doc §5). Remediatie-opties (platform):
- Sta egress naar `cms.bedigital.ai` toe vanaf de agent-/buildomgeving, **of** valideer media op de Vercel-preview (die het CMS wél bereikt).
- Verifieer de huidige opslagimplementatie (Supabase Storage vs oude R2) in `Be-digital-cms`.
- Herstel/import ontbrekende beelden via de ondersteunde tenant-veilige media-import (bytes + DB-record; MEDIA.md), met bronmapping + checksums. Geen stockbeelden, geen hotlinks, geen versoepelde publieke rechten.
- Aftekenen pas met bewijs: elk gebruikt beeld `naturalWidth>0`, juiste crop/onderwerp, zinvolle alt.

## 5. Commerce / LearnDash (aparte sprint; skelet)
Niet activeren zonder akkoord. Dry-run/sandbox vereist:
- Commerce-flag/PSP (Mollie) sandbox; verifieer in3-toelating + limieten (EUR50–5000, geen acceptatiegarantie) — niet beloven per dure opleiding; geen kunstmatige transactiesplitsing.
- Product/variant-handles ↔ oude SKU's ↔ LearnDash-cursus (mapping-doc §7 invullen; geen fictieve ID's).
- Test end-to-end: cursus → datum/locatie → plaats → mandje → betaling → order → bevestigingsmail → toegang. Plus dubbelklik, herhaalde events, pending/weigering/annuleren, bedragmismatch, (deel)refund, beperkte voorraad. Betaalstatus alleen server-side via PSP-verificatie (geen return-url/browserinput). Voorkom de oude nulbedrag/aanbetalingsfout.
- LearnDash-overdracht: order → interne taak → klantmail → activatie → juiste cursus; leg subdomein/login/reset + cursusafhankelijke toegang vast. Geen claim van directe automatische toegang als die ontbreekt.

## 6. Vercel (read-only)
Alleen-lezen inspectie van de drie IZZI Vercel-projecten (builds/logs/preview). **Niets verwijderen.** Geen productie-DNS-wijziging. Merge pas na akkoord; PR blijft draft zolang P0/P1 open zijn.
