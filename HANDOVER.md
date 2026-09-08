# Overdracht — frontend IZZI Beauty

Welkom. Dit is de **live klantsite** van IZZI Beauty. Deze pagina is het startpunt; daarna lees je
`README.md` (architectuur) en `ai-guide.md` (routes, contentmodel, uitzonderingen).

## 1. Welke repo

| Repo | Wat het is | Werk je hierin? |
| --- | --- | --- |
| `Bedigital-cms/izzi-beauty-11eaef` | de **live** site van de klant, aangemaakt door de CMS-provisioning | **Ja** |
| `Bedigital-cms/izzi-beauty` | het **template** waar nieuwe tenants van worden afgeleid | Nee, tenzij een fix voor álle nieuwe sites bedoeld is |

De twee zijn inmiddels uit elkaar gelopen (de klantsite heeft o.a. `kennisbank`, `ons-team`,
`onze-locaties`, `werkwijze`, `videos`, `VideoEmbed.tsx`, `lib/commerce/in3.ts`). Een verbetering die
generiek is, breng je apart ook in het template — dat gaat niet automatisch.

## 2. Toegang die je nodig hebt

- **GitHub**: lid van de org `Bedigital-cms` met write-rechten op `izzi-beauty-11eaef` (Barry nodigt uit).
- **Vercel**: het project van deze tenant, om builds, logs en preview-URL's te zien.
- **CMS** (`https://app.bedigital.ai`): handig maar niet strikt nodig — daar zit de content-editor,
  de media en de webshopdata.

## 3. Lokaal draaien

```sh
git clone https://github.com/Bedigital-cms/izzi-beauty-11eaef.git
cd izzi-beauty-11eaef
pnpm install
pnpm dev --port 3001
```

Node ≥ 20.9 (`package.json` → `engines`), pnpm als package manager.

`.env` **staat bewust in de repo** en wijst naar het productie-CMS (`app.bedigital.ai`) voor media en
formulieren. Je hoeft dus niets in te vullen; media laadt meteen. Er staan geen secrets in — de
storefront-sleutel (`COMMERCE_API_KEY`) staat alleen op Vercel en hoort nooit in git.

Open de site op **`http://izzi-beauty.localhost:3001`**, niet op `localhost:3001`. Het CMS herleidt de
tenant uit de Origin-host; op bare `localhost` mislukken formulierinzendingen.

De webshop staat in de repo-env uit (`NEXT_PUBLIC_COMMERCE_ENABLED=0`): `/shop`, `/cart`, `/checkout` en
`/order` geven dan lokaal een 404. Dat is verwacht gedrag, geen bug.

## 4. Werkwijze — dit is het belangrijkste deel

`main` is **niet van jou alleen**. Het CMS commit er zelf naartoe: content-wijzigingen via de Content
Editor, de AI-agent en integratie-/env-updates (zie `git log` — auteurs `IZZI AI Agent` en
`BE Digital Platform`). Daarom:

1. **Werk altijd op een branch**, bijvoorbeeld `feature/header-mobiel`. Push nooit direct naar `main`.
2. **Gebruik nooit het prefix `ai/`.** Dat is het domein van het CMS: het inventariseert `ai/`-branches,
   berekent conflicten tussen wachtende wijzigingen en mag ze automatisch mergen. Een eigen branch met
   dat prefix loopt in die machinerie mee.
3. **`git pull --rebase origin main` vóór je pusht.** `main` is verschoven terwijl je werkte.
4. **Vercel bouwt elke branch** en geeft een preview-URL. Gebruik die om je werk te laten zien vóór de merge.
5. **Merge via een pull request** naar `main`. Een merge naar `main` = productie-deploy; er is geen extra
   handmatige stap en geen branch-protection die je tegenhoudt.
6. **Vóór elke push moet dit slagen:**
   ```sh
   pnpm typecheck && pnpm build
   ```
   Er is geen CI in deze repo — Vercel is de enige poort. Een gebroken `main` blokkeert ook het
   publiceren van CMS-contentwijzigingen, dus dit is geen formaliteit.

## 5. Waar blijf je af

- **`content/**/*.json`** — dit is het terrein van de klant en het CMS. De Content Editor schrijft hele
  bestanden weg ("dit bestand moet exact dit zijn"), dus jouw handmatige edit in hetzelfde bestand gaat
  verloren of geeft een merge-conflict. Tekst en afbeeldingen wijzig je in het CMS, niet in git.
  Structuur (nieuwe velden, nieuwe secties) is wél code-werk — dan hoort er ook een regel in
  `content/editable.json` bij.
- **`.env`** — beheerd door de provisioning. Wil je iets anders lokaal, gebruik `.env.local` (gitignored).
- **`/_import`** — eenmalig media-migratieartefact, gitignored. Zie `MEDIA.md`.
- **Buildtijd-fetches in de webshoppagina's** — alles is `force-dynamic` met `generateStaticParams() → []`.
  Eén fetch op buildtijd laat de publicatie van élke tenant falen. Zie `README.md` → Webshop.
- **Slugs** — de URL's zijn vlak (`/nl/lip-blush`). Slugs moeten globaal uniek zijn en mogen niet gelijk
  zijn aan een vaste routenaam. Een build-time guard faalt bewust bij een botsing.

Let op: deze repo is op GitHub **publiek**. Zet er niets in wat dat niet mag zijn.

## 6. Jouw werkterrein

Frontend-aanpassingen zitten vooral in:

- `app/globals.css` — het volledige design system (tokens, typografie, spacing)
- `components/` — `Header`, `Footer`, `MobileMenu`, `Shell`, `sections.tsx`, `Media`, `Form`, `VideoEmbed`
- `components/sections.tsx` — de herbruikbare renderers waar de pagina's uit zijn opgebouwd
- `app/[locale]/` — routes; `[slug]/page.tsx` rendert élke detailpagina

## 7. Verder lezen

1. `README.md` — structuur, vlakke URL's, webshop, media
2. `ai-guide.md` — routes → contentbestand, keyed collections, velden, uitzonderingen
3. `MEDIA.md` — hoe media werkt (bytes + DB-record, altijd via het CMS)
