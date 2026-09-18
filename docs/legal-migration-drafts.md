# Juridische migratie — REVIEWCONCEPTEN (niet juridisch gevalideerd)

> ⚠️ **Status: migratieconcept voor review.** De teksten hieronder zijn **verbatim overgenomen van de oude productiesite** `izzi-beauty.com` (opgehaald 2026-09-18) als migratiebron. Ze zijn **niet** door een jurist gevalideerd, **niet** live op de nieuwe site gezet en mogen **niet** ongewijzigd als juridisch geldende voorwaarden worden gepubliceerd. `content/nl/legal.json` bevat nog de verkorte voorbeeldteksten; die vervangen we pas na goedkeuring door de klant/jurist. Er zijn **geen** nieuwe juridische bepalingen verzonnen en gevonden conflicten zijn **niet** stil opgelost — ze staan in §"Verschillen & conflicten".

Bron: `/nl/algemene-voorwaarden/`, `/nl/privacy-verklaring/`, `/nl/opleidingen-voorwaarden/` (ophaaldatum 2026-09-18, passieve GET).

## Verschillen & conflicten voor de nieuwe situatie (te beslissen door klant/jurist)
1. **Adresconflict Amsterdam.** Header algemene voorwaarden + privacyverklaring: *"Koningin Wilhelminaplein **1**, 1062 **HG**"* (KVK 86970283). Footer van diezelfde pagina's + contactpagina: *"Koningin Wilhelminaplein **13**, 1062 **HH**"*. Nummer én postcode wijken af. **Welke is juist?** (De site gebruikt nu 13 / 1062 HH.)
2. **Den Bosch als entiteit.** `opleidingen-voorwaarden` noemt *"IZZI Beauty Den Bosch BV"*, adres *Zilverenberg 37a, 5234GL*, KVK 97574864, meermaals als contractspartij. Besluit deze release: Den Bosch **niet** meer als actieve vestiging tonen. → De opleidingsvoorwaarden moeten juridisch worden herzien of de entiteit blijft contractueel bestaan; **niet stil aangepast**.
3. **Verouderde privacygrondslag.** Algemene voorwaarden §4 verwijst nog naar *"Wet Bescherming Persoonsgegevens"* (vervangen door AVG/GDPR), terwijl de aparte privacyverklaring wél AVG noemt. Harmoniseren.
4. **Nieuwe leveranciers/flow niet gedekt.** De oude voorwaarden gaan uit van: IZZI-eigen webshop + verzending (§13), contant/pin ter plaatse, en eigen online leerplatform. De nieuwe situatie introduceert: **Laliqa** (retail/webshop extern), **Mollie/iDEAL in3** (betaling/termijnen), **LearnDash** (online cursustoegang), **Salonized** (boeken), **IZZI Clinic** (laserontharen). Betaal-, herroepings-, verzend- en toegangsbepalingen moeten hierop worden afgestemd (bv. in3-termijnen, digitale-content-herroepingsrecht, retourroute Laliqa).
5. **Klachten-/geschilinstanties.** Algemene vw noemt *"Zorg voor ZZP"*; opleidingen-vw noemt *"Tutti Colori Nail Bar, Meent 122, Rotterdam"* als onafhankelijk deskundige. Nog actueel/geldig? Bevestigen.
6. **Dubbele handelsnaam** *"IZZI Brows / IZZI Beauty BV"* — consolideren naar de huidige naam.
7. **Gevoelige gegevensbepaling.** Algemene vw §5 en opleidingen-vw beschrijven het maken van een **foto van ID/paspoort (BSN afgeplakt)** bij termijnbetaling. AVG-proportionaliteit door jurist laten toetsen vóór (her)publicatie.
8. **Prijzen/bedragen in de tekst** (o.a. €50/€75/€100/€250 herstel-/examen-/model-/terugkomdagkosten, 25%/50% aanbetaling, €75 derde behandeling). Actualiseren tegen de huidige tarieven; niet verzinnen.

---

## Concept A — Algemene Voorwaarden (bron: `/nl/algemene-voorwaarden/`)
> Verbatim migratiebron; nog te reviewen. Bevat 15 artikelen: 1. Algemeen (incl. contact/KVK) · 2. Afspraken (incl. Touch-up 6–8 wkn, €50) · 3. Betaling · 4. Persoonsgegevens & privacy · 5. Geheimhouding (incl. ID-foto bij termijnen) · 6. Aansprakelijkheid · 7. Beschadiging en diefstal (camera's) · 8. Klachten (Zorg voor ZZP; geen restitutie) · 9. Behoorlijk gedrag (geen kinderen <16) · 10. Annuleren behandeling (25% aanbetaling niet-restitueerbaar, 1 jaar geldig) · 11. Opleidingen (aanmelding, niet-restitueerbare aanbetaling, termijnen, terugkomdag €100) · Online Trainingen (geen herroeping na toegang) · 12. Beeldmateriaal · 13. Verzending webshop (PostNL, PMU-machine retour binnen 14 dgn) · 14. Behandelvoorwaarden (14 punten: oude PMU melden, zwangerschap, botox/fillers, derde behandeling €75, laseren = garantieverval, …) · 15. Aansprakelijkheid (7 punten).
>
> Volledige tekst staat in de PR-diff/branchhistorie van dit reviewconcept; kernpunten hierboven. Voor publicatie: jurist-review + afstemmen op de nieuwe leveranciers/flow (zie conflicten 3–4–7–8).

## Concept B — Privacyverklaring (bron: `/nl/privacy-verklaring/`)
> IZZI Beauty BV, *"Koningin Wilhelminaplein 1, 1062 HG Amsterdam"* (zie adresconflict #1). 8 secties: 1. Persoonsgegevens (naam, telefoon, e-mail) · 2. Doel/grondslag (betaling, nieuwsbrief, contact) · 3. Bewaartermijn · 4. Delen met derden · 5. Cookies · 6. Inzage/aanpassen/verwijderen (kopie ID met BSN afgeplakt; reactie <4 wkn; AP-klacht) · 7. Beveiliging · 8. Cookietoestemming via **CookieFirst** (Digital Data Solutions BV) + serverlogbestanden.
>
> Aandacht: CookieFirst-CMP is nog niet zichtbaar in de nieuwe integratieconfig (alleen Salonized + WhatsApp actief) — cookie-/consenttekst moet matchen met wat er daadwerkelijk draait (zie tracking-item in de checklist).

## Concept C — Opleidingen Voorwaarden (bron: `/nl/opleidingen-voorwaarden/`)
> *"Opleidingen IZZI Beauty BV en IZZI Beauty Den Bosch BV per 1 januari 2021"* (zie Den Bosch-conflict #2). 15 artikelen: 1. Algemeen · 2. Inspanningen · 3. Inschrijving · 4. Betaling cursusgeld (termijnen zonder extra kosten) · 5. Annulering (14 dgn herroeping; daarna 50%; startpakket/online = geen herroeping; privé 30 dgn/50–100%; model te laat €250) · 6. Persoonsgegevens & privacy · 7. Geheimhouding · 8. Aansprakelijkheid · 9. Auteurs-/eigendomsrecht · 10. Lessen/examens (2 gratis herkansingen, daarna €250) · 11. Beschadiging & diefstal · 12. Klachten (**Tutti Colori Nail Bar Rotterdam** als deskundige) · 13. Einde cursusovereenkomst · 14. Behoorlijk gedrag · 15. Recht (NL; KvK Amsterdam & Den Bosch).
>
> Voor publicatie: entiteit/adres Den Bosch (conflict #2), termijn-/in3-afstemming (conflict #4) en actuele bedragen (conflict #8) door klant/jurist bevestigen.
