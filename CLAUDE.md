# IZZI Beauty — LIVE klantsite

Dit is **niet** een template of een oefenproject: dit is de productiesite van de klant IZZI Beauty.
Een merge naar `main` staat binnen enkele minuten live. Er is geen CI en geen branch-protection die een
fout tegenhoudt — deze afspraken zijn de enige bescherming.

Lees ook:

- **`ai-guide.md`** — routes, contentmodel, keyed collections, gereserveerde slugs, uitzonderingen.
  Leidend voor "waar staat wat". Werk het bij als je routes of collecties toevoegt of verwijdert.
- **`README.md`** — architectuur, vlakke URL's, webshop, media.
- **`HANDOVER.md`** — de menselijke overdracht (toegang, lokaal draaien).

---

## 1. Deze repo wordt door twee partijen bewerkt

Naast mensen commit **het CMS zelf** naar `main`: content via de Content Editor, de CMS-AI-agent en
integratie-/env-updates. Zie `git log` — auteurs `IZZI AI Agent` en `BE Digital Platform`. Daaruit
volgen vier harde regels:

1. **Werk altijd op een eigen branch** (`feature/...`, `fix/...`). Commit nooit direct op `main`.
2. **Gebruik nooit het branch-prefix `ai/`.** Dat prefix is van het CMS: het inventariseert
   `ai/`-branches, berekent conflicten tussen wachtende wijzigingen en kan ze automatisch mergen.
   Een eigen branch met dat prefix loopt in die machinerie mee.
3. **`git pull --rebase origin main` vóór elke push.** `main` is verschoven tijdens je werk.
4. **Merge via een pull request.** Vercel bouwt elke branch en geeft een preview-URL; laat die zien
   vóór de merge.

## 2. Definitie van klaar

```sh
pnpm typecheck && pnpm build
```

Beide exit 0, vóór elke commit. Vercel is de enige poort naar productie, en een gebroken `main`
blokkeert óók het publiceren van contentwijzigingen door de klant zelf. Dit is geen formaliteit.

## 3. Wat je NIET aanraakt

- **`content/**/*.json`** — het terrein van de klant en het CMS. De Content Editor schrijft **hele
  bestanden** weg ("dit bestand moet exact dit zijn"), dus een handmatige tekstedit hier verdwijnt bij
  de volgende CMS-wijziging of geeft een merge-conflict. Tekst en beeld wijzigen gebeurt in het CMS.
  *Structuur* (een nieuw veld, een nieuwe sectie) is wél code-werk — voeg dan ook een regel toe aan
  `content/editable.json`, anders kan de klant het niet bewerken.
- **`.env`** — beheerd door de provisioning en bewust gecommit (geen secrets: de storefront-sleutel
  staat alleen op Vercel). Wil je lokaal iets anders, gebruik `.env.local` (gitignored).
- **Plumbing** — `next.config.ts`, `proxy.ts`, `content/load.ts`, `lib/i18n.ts`, `lib/href.ts`,
  `lib/locales.ts`, `app/media/[filename]/route.ts`, `app/layout.tsx`, en de scriptnamen in
  `package.json` (het CMS roept `dev`/`build`/`start`/`lint`/`typecheck` exact zo aan).
- **`/_import`** — eenmalig media-migratieartefact, gitignored. Zie `MEDIA.md`.

Deze repo is op GitHub **publiek**. Zet er niets in wat dat niet mag zijn.

## 4. Drie dingen die stil kapot gaan

- **Vlakke URL's + unieke slugs.** Elke detailpagina staat direct onder de taal (`/nl/lip-blush`),
  gerenderd door één route: `app/[locale]/[slug]/page.tsx`. Slugs moeten globaal uniek zijn en mogen
  niet gelijk zijn aan een vaste routenaam. Een build-time guard faalt bewust bij een botsing — dat is
  opzet, geen bug. Maak **nooit** een nieuw route-bestand voor een detailpagina; voeg een key toe aan de
  JSON. Volledige lijst gereserveerde namen: `ai-guide.md`.
- **Geen fetch op buildtijd in de webshoppagina's.** Alles daar is `force-dynamic` met
  `generateStaticParams() → []`. Het CMS bouwt deze repo vóór publiceren zónder bereikbare webshop-API;
  één fetch op buildtijd laat de publicatie van élke tenant falen.
- **De site blijft statisch.** Lees geen cookies of headers in `Header` of in een pagina — dan wordt
  elke pagina dynamisch. De winkelwagen-badge is daarom een client-component.

## 5. Waar frontend-werk zit

- `app/globals.css` — het volledige design system (tokens, typografie, spacing)
- `components/` — `Header`, `Footer`, `MobileMenu`, `Shell`, `Media`, `Form`, `VideoEmbed`
- `components/sections.tsx` — de herbruikbare renderers waaruit de pagina's zijn opgebouwd
- `app/[locale]/` — routes

Styling is plain CSS in `globals.css`. Geen runtime-CSS-in-JS (styled-components, emotion): dat breekt
de statische build.

## 6. Lokaal

```sh
pnpm install
pnpm dev --port 3001
```

Open **`http://izzi-beauty.localhost:3001`**, niet `localhost:3001` — het CMS herleidt de tenant uit de
Origin-host, dus op bare `localhost` mislukken formulierinzendingen. Media en formulieren komen uit het
productie-CMS (`app.bedigital.ai`); dat werkt out of the box.

De webshop staat in de repo-env uit (`NEXT_PUBLIC_COMMERCE_ENABLED=0`), dus `/shop`, `/cart`,
`/checkout` en `/order` geven lokaal een 404. Verwacht gedrag.
