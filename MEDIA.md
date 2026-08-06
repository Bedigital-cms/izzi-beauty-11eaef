# Media & afbeeldingen — IZZI Beauty

Alle afbeeldingen zijn **content**, geen code. Ze staan als velden in `content/<locale>/*.json` en zijn
dus volledig bewerkbaar via het **admin-dashboard (Content Editor)**. Geen enkele afbeelding is
hardcoded in een component.

## Hoe media werkt

De site slaat zelf geen bestanden op. Content verwijst altijd naar `/media/<bestandsnaam>`; de route
`app/media/[filename]/route.ts` stuurt dat door (302) naar het publieke, tenant-scoped media-endpoint
van het CMS, dat het bestand streamt (lokaal) of doorstuurt naar R2 (productie).

Twee omgevingsvariabelen zijn verplicht, anders krijg je 404's en dus gebroken afbeeldingen:

```
MEDIA_PUBLIC_BASE=http://localhost:3000/media   # prod: https://cms.bedigital.nl/media
MEDIA_TENANT_SLUG=izzi-beauty
```

Een bestand heeft **twee** delen nodig: de bytes én een DB-record in het CMS. Eén van de twee alleen
geeft 404. Handmatig bestanden in `<cms>/media/` zetten werkt dus niet — gebruik de import (hieronder)
of upload via CMS → Media.

## De gemigreerde afbeeldingen (eenmalig)

Alle beeldmateriaal van de oorspronkelijke site (`izzi-beauty.com`) staat in:

```
_import/izzi-beauty/
```

**84 bestanden**, waarvan er **77 door de content worden gebruikt** (elke `/media/…`-verwijzing in
`content/**/*.json` heeft een bestand — er ontbreekt niets). De overige **7 zijn reserve**: ze horen
bij geen enkel contentveld, maar zijn wél meegenomen en hernoemd, zodat ze na de import in de
mediabibliotheek staan en via de Content Editor te kiezen zijn.

| Groep | Aantal | Datumsegment |
|---|---|---|
| Blog-featured images | 34 | publicatiedatum van de post |
| Overige site-media (behandelingen, opleidingen, home, logo, locaties…) | 43 | `20250729` (tenant-snapshot) |
| Reserve, nergens gekoppeld | 7 | `20250729` |

Deze map staat **bewust in `.gitignore`** — een eenmalig afleveringsartefact dat niet met elke kopie
van deze repo hoort mee te reizen.

> ⚠️ **Omdat de map gitignored is, reist hij NIET mee met `git clone` of met een tenant die uit dit
> template wordt aangemaakt.** Kopieer `_import/izzi-beauty/` dus handmatig mee (of haal hem uit dit
> template) vóór je importeert. Zonder die bestanden verwijst de content naar media die niet bestaat
> en zie je gebroken afbeeldingen.

### Bestandsnamen

Het CMS leidt de alt-tekst af uit de bestandsnaam. Alle bestanden volgen dit schema:

```
{tenantSlug}-{YYYYMMDD}-{randomId}-{slugifiedOriginalName}.{extension}
```

| Segment | Waarde | Toelichting |
|---|---|---|
| `tenantSlug` | `izzi-beauty` | dezelfde slug als `MEDIA_TENANT_SLUG` |
| `YYYYMMDD` | datum | blogafbeelding: de `date` van de post die hem gebruikt (bij een gedeelde afbeelding de **vroegste** post). Overige media hebben geen publicatiedatum en krijgen `20250729`, de tenant-snapshotdatum |
| `randomId` | 6 hex-tekens | eerste 6 tekens van de SHA-256 van de bytes |
| `slugifiedOriginalName` | leesbare slug | oorspronkelijke bestandsnaam, lowercase, diakrieten weg, niet-alfanumeriek → `-` |
| `extension` | `jpg` / `png` / `webp` | `.jpeg` is genormaliseerd naar `.jpg` |

```
Brow-Lamination-Opleiding.webp        →  izzi-beauty-20251110-ed7eb7-brow-lamination-opleiding.webp
Faux-Feckles-permanente-make-up.jpeg  →  izzi-beauty-20251126-79b34a-faux-feckles-permanente-make-up.jpg
```

> `randomId` is **afgeleid van de bytes**, niet echt willekeurig. Daardoor is de naam stabiel:
> dezelfde afbeelding levert altijd dezelfde bestandsnaam op, dus opnieuw importeren kan geen
> duplicaten maken. Genereer dit segment nooit met een echte random-functie — dan verlies je die
> garantie.

WordPress serveert afbeeldingen ook in afgeleide maten (`-1024x683`, `-768x768`). Die suffixen zijn
verwijderd vóór het downloaden, zodat telkens het **origineel** in volle resolutie is opgehaald.

### 34 blogafbeeldingen, 50 artikelen

Minder bestanden dan artikelen, omdat de oude site afbeeldingen hergebruikte. Dat is overgenomen zoals
het was:

| Aantal posts | Bestand | Wat het is |
|---|---|---|
| 14 | `izzi-beauty-20211112-63dbd8-3-1.png` | de **site-brede fallback** van de oude site: deze 14 posts hadden daar géén eigen featured image |
| 2 | `izzi-beauty-20251110-8a9cc1-powder-brows-plaatsen-en-tekenen.png` | dezelfde foto op twee verwante posts |
| 2 | `izzi-beauty-20251110-7247ce-mislukt.jpg` | idem (twee posts over mislukte PMU) |
| 2 | `izzi-beauty-20251110-351254-ontwerp-zonder-titel-93.png` | idem |
| 1 elk | overige 30 bestanden | eigen featured image per post |

### De 7 reservebestanden

Deze staan wél in `_import/` (en dus straks in de mediabibliotheek), maar zijn aan géén contentveld
gekoppeld. Wil de klant er een gebruiken, dan kiest zij hem in de Content Editor bij het betreffende
`image`-veld — er hoeft niets in code te wijzigen.

```
izzi-beauty-20250729-278be0-pmu-machine.webp
izzi-beauty-20250729-2a7a36-infralash-eyeliner-pmu.webp
izzi-beauty-20250729-5905c6-infralash-pmu-opleiding.webp
izzi-beauty-20250729-75159f-fineline-masterclass-werk.webp
izzi-beauty-20250729-7d9703-fineline-tattoo-werk.jpg
izzi-beauty-20250729-a6df4a-cde6b669734976b6b04d272131814b3d.webp
izzi-beauty-20250729-c50172-izzi-beauty-template.png
```

> ⚠️ Die 14 posts tonen dus dezelfde generieke afbeelding als op de oude site. Wil de klant daar een
> eigen beeld? Dan uploadt zij dat via CMS → Media en selecteert het in de Content Editor bij het
> `image`-veld van de betreffende post. Niets in de code hoeft daarvoor te wijzigen.

### Importeren

```
1.  Kopieer de inhoud naar:   <cms>/media/_import/izzi-beauty/
    (die map bestaat nog niet bij een nieuwe tenant — zelf aanmaken)
2.  CMS → Media → "Importeren"
3.  De import maakt per bestand een DB-record aan (tenant-gekoppeld) én verplaatst het bestand;
    de staging-kopie wordt daarna opgeruimd.
```

Import is superadmin-only. **Draai de import vóór livegang**: tot dan verwijzen de 50 posts naar een
`/media/<bestand>` dat nog niet bestaat, en dat geeft een gebroken `<img>` (een nette placeholder
verschijnt alleen bij een leeg pad).

## Overige mediavelden

De blogafbeeldingen staan in `content/nl/blog.json` (`posts.<slug>.image`). De belangrijkste overige
velden, allemaal bewerkbaar in de Content Editor:

| Sectie | Bestand | Veld (JSON-pad) |
|---|---|---|
| Hero-achtergrond | `home.json` | `hero.image` |
| Hero-achtergrondvideo (optioneel) | `home.json` | `hero.videoUrl` — leeg = `hero.image` wordt gebruikt |
| Intro / over-ons beeld | `home.json` | `intro.image` |
| Behandeling-/opleidingkaarten | `home.json` | `treatments.items[].image`, `trainings.items[].image` |
| Behandeling-detailpagina's | `services.json` | `<slug>.image` |
| Opleiding-detailpagina's | `trainings-detail.json` | `<slug>.image` |
| Logo (header + footer) | `site.json` | `logo` — leeg = merknaam als tekst-logo |
| Portfolio-galerij | `portfolio.json` | `images[]` |

## Zo vervang je een afbeelding

1. Open **admin-dashboard → Content Editor** en kies het bestand (bv. "Blog (index + artikelen)").
2. Zoek het `image`-veld, upload je nieuwe beeld of kies er een uit de mediabibliotheek.
3. Opslaan → change request → preview → approve. Na deploy toont de site het nieuwe beeld.

De editor schrijft altijd het relatieve pad `/media/<bestand>` in de content-JSON; verder is er niets
nodig. Elk veld met een naam die eindigt op `video`/`videoUrl` krijgt automatisch het
video-upload-paneel (mp4/webm) in plaats van het afbeeldingpaneel.

## Productafbeeldingen (webshop)

Productafbeeldingen komen **niet** uit `content/` maar uit de CMS-database, samen met het product zelf:
upload ze in het CMS onder **Webshop → Producten → Afbeeldingen**. De API geeft ze terug als hetzelfde
relatieve pad `/media/<bestand>`, dus dezelfde `/media`-proxy en dezelfde `<Media>`-placeholder werken —
er was hiervoor geen enkele wijziging aan de media-laag nodig.

Wat wél anders is: een overzichtspagina toont tot **24 producten**, en deze template gebruikt bewust
gewone `<img>` in plaats van `next/image`. Dat zijn dus 24 losse 302-hops naar het CMS, op volledige
afmeting. Beperkt door:

- `loading="lazy"` en vaste verhoudingen op elke productkaart (geen layout-verschuiving, alleen
  zichtbare beelden worden geladen);
- 24 producten per pagina als bovengrens.

**Upload dus geknipte, geoptimaliseerde beelden** — vierkant, ±800×800, onder ~150 kB. Er is nog géén
server-side beeldverkleining voor producten (`thumb`/`card`/`full`-varianten in het CMS staan op de
lijst, maar bestaan nog niet). Een grid met 24 ongecomprimeerde camerabestanden is daardoor traag, en
dat is op dit moment de enige echte rem op de webshop-prestaties.

Producten zonder foto zijn geen probleem: `<Media>` toont de nette placeholder met de productnaam, net
als bij content zonder beeld.
