#!/usr/bin/env node
/**
 * IZZI content-regressietests (opdracht §10).
 *
 * Bewust een lichte, dependency-vrije node-checker (geen test-framework toegevoegd aan de
 * klantrepo): valideert de veelvoorkomende migratie-fouten die anders stil terugkeren —
 * placeholder-content, verkeerde CTA-intentie, kapotte nav-links, verkeerde cursusmapping,
 * en de nav/footer-structuur uit deze sprint. Draai met: `pnpm test`.
 *
 * Exit 1 bij een gevonden regressie, met een duidelijke melding.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const rd = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const keys = (o) => Object.keys(o || {});

const failures = [];
const fail = (msg) => failures.push(msg);
const ok = [];
const pass = (msg) => ok.push(msg);

// ---------- 1. Geen placeholder e-mailadressen in publieke content ----------
for (const f of ['content/forms.json', 'content/nl/home.json', 'content/nl/site.json']) {
  const raw = fs.readFileSync(path.join(ROOT, f), 'utf8');
  if (/example\.com/i.test(raw)) fail(`placeholder e-mail (example.com) in ${f}`);
}
pass('geen example.com in site/home/forms');

// ---------- 2. Navigatie: exacte top-level volgorde + externe bestemmingen ----------
const site = rd('content/nl/site.json').site;
const expectedNav = [
  ['Behandelingen', '/behandelingen'],
  ['Prijzen', '/prijzen'],
  ['Opleidingen', '/opleidingen'],
  ['Online Trainingen', '/online-trainingen'],
  ['Blog', '/blog'],
  ['Kennisbank', '/kennisbank'],
  ['Webshop', 'https://laliqa.com'],
  ['Over IZZI', '/over-izzi'],
  ['Laserontharen', 'https://izziclinic.nl'],
];
const actualNav = site.nav.map((i) => [i.label, i.url]);
if (JSON.stringify(actualNav) !== JSON.stringify(expectedNav)) {
  fail(`nav-volgorde/bestemmingen wijken af:\n  verwacht: ${JSON.stringify(expectedNav)}\n  gevonden: ${JSON.stringify(actualNav)}`);
} else pass('nav-volgorde + externe Webshop/Laserontharen correct');

// ---------- 2b. EN-nav: dezelfde URL-structuur, Blog + Knowledge Base als aparte ingangen ----------
const enSite = rd('content/en/site.json').site;
const expectedEnNav = [
  ['Treatments', '/behandelingen'],
  ['Prices', '/prijzen'],
  ['Training Courses', '/opleidingen'],
  ['Online Training', '/online-trainingen'],
  ['Blog', '/blog'],
  ['Knowledge Base', '/kennisbank'],
  ['Shop', 'https://laliqa.com'],
  ['About IZZI', '/over-izzi'],
  ['Laser Hair Removal', 'https://izziclinic.nl'],
];
const actualEnNav = enSite.nav.map((i) => [i.label, i.url]);
if (JSON.stringify(actualEnNav) !== JSON.stringify(expectedEnNav)) {
  fail(`EN nav-volgorde/bestemmingen wijken af:\n  verwacht: ${JSON.stringify(expectedEnNav)}\n  gevonden: ${JSON.stringify(actualEnNav)}`);
} else pass('EN nav-pariteit: Blog + Knowledge Base als aparte ingangen');
const nlNavUrls = site.nav.map((i) => i.url);
const enNavUrls = enSite.nav.map((i) => i.url);
if (JSON.stringify(nlNavUrls) !== JSON.stringify(enNavUrls)) {
  fail(`NL/EN nav-URL-volgorde wijkt af:\n  nl: ${JSON.stringify(nlNavUrls)}\n  en: ${JSON.stringify(enNavUrls)}`);
} else pass('NL/EN nav-URL-volgorde identiek');

// ---------- 3. Over IZZI is een dropdown; Ervaringen pas als de content bestaat ----------
const overIzzi = site.nav.find((i) => i.label === 'Over IZZI');
if (!overIzzi?.columns?.length) fail('Over IZZI heeft geen dropdown (columns)');
const infoKeys = keys(rd('content/nl/info.json'));
const dropdownHasErvaringen = (overIzzi?.columns || []).some((c) => (c.links || []).some((l) => l.url === '/ervaringen'));
if (dropdownHasErvaringen && !infoKeys.includes('ervaringen')) {
  fail('Ervaringen staat in de nav maar info.json heeft nog geen "ervaringen"-content (pagina zou 404 geven)');
} else pass('Over IZZI dropdown consistent met ervaringen-content');

// ---------- 4. Opleidingen: "Extra" samengevoegd/verwijderd, "Extra Opleidingen" bestaat ----------
const opl = site.nav.find((i) => i.label === 'Opleidingen');
const oplCols = (opl?.columns || []).map((c) => c.heading);
if (oplCols.includes('Extra')) fail('losse Opleidingen-kolom "Extra" bestaat nog');
if (!oplCols.includes('Extra Opleidingen')) fail('Opleidingen-kolom "Extra Opleidingen" ontbreekt');
if (!oplCols.includes('Extra') && oplCols.includes('Extra Opleidingen')) pass('Opleidingen: Extra samengevoegd in Extra Opleidingen');

// ---------- 5. Footer: e-mail, geen Den Bosch, Blog én Kennisbank als aparte ingangen ----------
const footer = site.footer;
if (footer.email !== 'info@izzi-beauty.com') fail(`footer e-mail is ${footer.email}, verwacht info@izzi-beauty.com`);
if ((footer.locations || []).some((l) => /den bosch|hertogenbosch/i.test(`${l.name} ${l.city}`))) fail('Den Bosch staat nog als actieve footer-locatie');
const infoCol = (footer.columns || []).find((c) => c.heading === 'Informatie');
if ((infoCol?.links || []).some((l) => l.label === 'Blogs')) fail('footer heeft nog het oude label "Blogs" i.p.v. "Blog"');
if (!(infoCol?.links || []).some((l) => l.label === 'Blog' && l.url === '/blog')) fail('footer mist Blog -> /blog');
if (!(infoCol?.links || []).some((l) => l.label === 'Kennisbank' && l.url === '/kennisbank')) fail('footer mist Kennisbank -> /kennisbank');
if (!failures.some((m) => m.startsWith('footer'))) pass('footer e-mail/locaties/Blog+Kennisbank correct');

const enInfoCol = (enSite.footer.columns || []).find((c) => c.heading === 'Information');
if ((enInfoCol?.links || []).some((l) => l.label === 'Blogs')) fail('EN footer heeft nog het oude label "Blogs" i.p.v. "Blog"');
if (!(enInfoCol?.links || []).some((l) => l.label === 'Blog' && l.url === '/blog')) fail('EN footer mist Blog -> /blog');
if (!(enInfoCol?.links || []).some((l) => l.label === 'Knowledge Base' && l.url === '/kennisbank')) fail('EN footer mist Knowledge Base -> /kennisbank');
if (!failures.some((m) => m.startsWith('EN footer'))) pass('EN footer Information: Blog + Knowledge Base aanwezig');

// ---------- 6. CTA-intentie: geen kapotte / verkeerde links ----------
const services = new Set(keys(rd('content/nl/services.json')));
const trainings = new Set(keys(rd('content/nl/trainings-detail.json')));

// 6a. Home "Lip Blush Opleiding" moet naar de OPLEIDING wijzen, niet de behandeling.
const home = rd('content/nl/home.json');
const lipOpl = (home.trainings?.items || []).find((i) => /lip blush opleiding/i.test(i.title));
if (lipOpl) {
  const slug = (lipOpl.url || '').replace(/^\//, '');
  if (services.has(slug) && !trainings.has(slug)) fail(`home "Lip Blush Opleiding" linkt naar behandeling ${lipOpl.url} i.p.v. de opleiding`);
  else if (!trainings.has(slug)) fail(`home "Lip Blush Opleiding" url ${lipOpl.url} is geen bestaande opleiding`);
  else pass('home Lip Blush Opleiding wijst naar de opleiding');
}

// 6b. Geen enkele nav/footer interne link mag naar een niet-bestaande pagina wijzen.
const fixed = fs.readdirSync(path.join(ROOT, 'app/[locale]'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
const nested = ['pmu-opleiding-lippen/veelgesteldevragen-lippen', 'online-trainingen-veelgestelde-vragen/veelgestelde-vragen-opleidingen-wenkbrauwen'];
const routable = new Set([
  ...services, ...trainings,
  ...keys(rd('content/nl/locaties.json')), ...keys(rd('content/nl/blog.json').posts),
  ...keys(rd('content/nl/info.json')), ...keys(rd('content/nl/legal.json')), ...fixed, ...nested,
]);
const internalUrls = [];
for (const item of site.nav) {
  internalUrls.push(item.url);
  for (const c of item.columns || []) for (const l of c.links || []) internalUrls.push(l.url);
}
for (const c of footer.columns || []) for (const l of c.links || []) internalUrls.push(l.url);
const broken = internalUrls.filter((u) => u && u.startsWith('/') && u !== '/' && !routable.has(u.slice(1)) && !nested.includes(u.slice(1)));
if (broken.length) fail(`kapotte interne nav/footer-links (geen route/content): ${[...new Set(broken)].join(', ')}`);
else pass('alle interne nav/footer-links resolven naar een route/content');

if (!fs.existsSync(path.join(ROOT, 'app/[locale]/blog/page.tsx'))) fail('/blog-route ontbreekt (app/[locale]/blog/page.tsx)');
if (!fs.existsSync(path.join(ROOT, 'app/[locale]/kennisbank/page.tsx'))) fail('/kennisbank-route ontbreekt (app/[locale]/kennisbank/page.tsx)');
const redirects = rd('content/redirects.json').redirects || [];
const blogKbRedirect = redirects.find((r) =>
  (r.source === '/blog' && r.destination === '/kennisbank') ||
  (r.source === '/kennisbank' && r.destination === '/blog'),
);
if (blogKbRedirect) fail(`redirect tussen Blog en Kennisbank: ${blogKbRedirect.source} -> ${blogKbRedirect.destination}`);
else pass('/blog en /kennisbank blijven aparte routes zonder onderlinge redirect');

// ---------- 7. Formulier-submit knop niet meer in de gouden gradient ----------
const css = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8');
const submitRule = css.match(/\.form button\[type="submit"\]\s*\{[^}]*\}/);
if (submitRule && /linear-gradient\(.*var\(--gold\)/.test(submitRule[0])) fail('.form submit-knop gebruikt nog de gouden gradient');
else pass('.form submit-knop niet meer goud');

// ---------- 8. Placeholders in ALLE publieke content (contact + juridisch) ----------
function walkJson(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkJson(p));
    else if (e.name.endsWith('.json')) out.push(p);
  }
  return out;
}
const contentFiles = walkJson(path.join(ROOT, 'content'));
// 8a. HARD: geen placeholder-e-mail in enige content.
const emailHits = contentFiles.filter((f) => /example\.com/i.test(fs.readFileSync(f, 'utf8')));
if (emailHits.length) fail(`placeholder e-mail in: ${emailHits.map((f) => path.relative(ROOT, f)).join(', ')}`);
else pass('geen example.com in enige content/**');

// ---------- 9. Route-mappen zonder renderbare pagina ----------
function hasPage(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && /^page\.(t|j)sx?$/.test(e.name)) return true;
    if (e.isDirectory() && hasPage(path.join(dir, e.name))) return true;
  }
  return false;
}
const localeDir = path.join(ROOT, 'app/[locale]');
const deadRoutes = fs.readdirSync(localeDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .filter((d) => !hasPage(path.join(localeDir, d.name)))
  .map((d) => d.name);
if (deadRoutes.length) fail(`route-map(pen) zonder page.tsx: ${deadRoutes.join(', ')}`);
else pass('elke route-map heeft een renderbare page.tsx');

// ---------- 10. Draft-artikelen niet publiek gelinkt ----------
const posts = rd('content/nl/blog.json').posts || {};
const draftSlugs = new Set(Object.entries(posts).filter(([, p]) => p.status === 'draft').map(([s]) => s));
const draftLinked = internalUrls.filter((u) => u && draftSlugs.has(u.replace(/^\//, '')));
if (draftLinked.length) fail(`draft-artikel publiek gelinkt in nav/footer: ${draftLinked.join(', ')}`);
else pass('geen draft-artikel in nav/footer gelinkt');

// ---------- 11. Kolomsamenvoeging: alle 'Extra' links behouden in 'Extra Opleidingen' ----------
const extraOplCol = (opl?.columns || []).find((c) => c.heading === 'Extra Opleidingen');
const mustHave = ['/inkless-stretch-mark-removal', '/saline-removal', '/lash-lift-training', '/brow-lamination-training', '/laser-ontharing-opleiding'];
const missingMerged = mustHave.filter((u) => !(extraOplCol?.links || []).some((l) => l.url === u));
if (missingMerged.length) fail(`samengevoegde 'Extra'-links ontbreken in 'Extra Opleidingen': ${missingMerged.join(', ')}`);
else pass('alle Extra-links behouden na samenvoeging');

// ---------- 12. Redirect-bestemmingen resolven ----------
const redirectRules = rd('content/redirects.json').redirects || [];
const badDest = redirectRules.filter((r) => {
  const d = (r.destination || '').replace(/^\//, '');
  return d && !routable.has(d) && !nested.includes(d) && d !== '';
});
if (badDest.length) fail(`redirect-bestemming(en) zonder route/content: ${badDest.map((r) => r.destination).join(', ')}`);
else pass('alle redirect-bestemmingen resolven');

// ---------- 13. Geprefixte legacy-redirect-fix aanwezig in next.config.ts ----------
const nextCfg = fs.readFileSync(path.join(ROOT, 'next.config.ts'), 'utf8');
const i18nCfg = rd('content/i18n.json');
if (i18nCfg.enabled === false && !/prefixPath\(defaultLocale, r\.source\)/.test(nextCfg)) {
  fail('single-locale prefix-redirect-fix ontbreekt in next.config.ts (buildRedirects !enabled-tak)');
} else pass('geprefixte legacy-redirect-fix aanwezig in next.config.ts');

// ---------- 14. Documentatie-consistentie (voorkomt stale/onbewezen claims) ----------
const legalDoc = fs.readFileSync(path.join(ROOT, 'docs/legal-migration-drafts.md'), 'utf8');
if (/verbatim overgenomen/i.test(legalDoc) || /volledige tekst staat in de pr-diff/i.test(legalDoc)) {
  fail('legal-migration-drafts.md claimt onterecht verbatim/volledige tekst (alleen samenvattingen aanwezig)');
} else pass('legal-doc claimt geen verbatim/volledige tekst');

const docFiles = fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => path.join(ROOT, 'docs', f));
// Geen onbewezen "Vercel bereikt/haalt het CMS wél"-bewering.
const vercelClaim = docFiles.filter((f) => /die het cms w[ée]l bereikt/i.test(fs.readFileSync(f, 'utf8')));
if (vercelClaim.length) fail(`onbewezen 'Vercel bereikt het CMS wél'-claim in: ${vercelClaim.map((f) => path.relative(ROOT, f)).join(', ')}`);
else pass('geen onbewezen Vercel-bereikt-CMS claim in docs');

// Prefix-redirect mag niet meer als OPEN platform-blokkade in de checklist staan.
const mc = fs.readFileSync(path.join(ROOT, 'docs/izzi-finalization-masterchecklist.md'), 'utf8');
if (/platform-plumbing fix nodig/i.test(mc)) fail('masterchecklist noemt prefix-redirect nog als openstaande platform-fix');
else pass('masterchecklist: prefix-redirect niet meer als open platform-fix');

// ---------- 15. Online-hub: geen kale /contact; prefill-CTA of eigen cursuspagina ----------
const online = rd('content/nl/online-trainingen.json');
const onlineItems = (online.groups || []).flatMap((g) => g.items || []);
const bareContact = onlineItems.filter((i) => i.url === '/contact' || i.url === '/online-trainingen');
if (bareContact.length) fail(`${bareContact.length} online-hubkaart(en) staan nog op kale /contact of /online-trainingen`);
else pass('geen online-hubkaart op kale /contact');
// Kaarten die naar de info-aanvraag (interesseformulier) wijzen, moeten de cursus meenemen.
const infoCards = onlineItems.filter((i) => (i.url || '').includes('#informatie-aanvragen') || (i.url || '').startsWith('/online-trainingen?'));
const missingPrefill = infoCards.filter((i) => !/opleiding_specifiek=/.test(i.url));
if (missingPrefill.length) fail(`online info-CTA zonder opleiding_specifiek-prefill: ${missingPrefill.map((i) => i.title).join(', ')}`);
else pass('online info-CTA\'s dragen de cursus mee (opleiding_specifiek)');
// Kaart met een EIGEN cursuspagina moet daarheen linken (niet naar de info-aanvraag).
const airbrush = onlineItems.find((i) => /airbrush/i.test(i.title));
if (airbrush && !trainings.has((airbrush.url || '').replace(/^\//, '').split(/[?#]/)[0])) {
  fail('Airbrush-online kaart linkt niet naar de bestaande cursuspagina');
} else pass('online kaart met eigen pagina linkt naar die pagina');

// ---------- 16. Geen blanket "levenslang toegang"-claim in de online hub ----------
if (/levenslang/i.test(fs.readFileSync(path.join(ROOT, 'content/nl/online-trainingen.json'), 'utf8'))) {
  fail('online-trainingen.json bevat nog een "levenslang toegang"-claim');
} else pass('geen blanket levenslang-toegang-claim in online hub');

// ---------- 17. Geen "CRKBO-erkend certificaat" (semantische fout) ----------
const crkboCertBug = Object.entries(rd('content/nl/trainings-detail.json'))
  .filter(([, d]) => ((d.aside && d.aside.facts) || []).some((f) => /^certificaat$/i.test(f.k) && /crkbo/i.test(f.v)))
  .map(([k]) => k);
if (crkboCertBug.length) fail(`Certificaat-fact met CRKBO-erkend (semantisch onjuist): ${crkboCertBug.join(', ')}`);
else pass('geen "CRKBO-erkend certificaat"-fact');

// ---------- 18. Geen fictieve productHandle (conventie opleiding-*) ----------
const badHandles = Object.entries(rd('content/nl/trainings-detail.json'))
  .filter(([, d]) => d.productHandle && !/^opleiding-[a-z0-9-]+$/.test(d.productHandle))
  .map(([k, d]) => `${k}:${d.productHandle}`);
if (badHandles.length) fail(`verdachte/fictieve productHandle: ${badHandles.join(', ')}`);
else pass('alle productHandles volgen de opleiding-*-conventie');

// ---------- 19. Behandeling-CTA wijst niet naar opleiding-content ----------
const svc = rd('content/nl/services.json');
const behToOpl = Object.entries(svc).filter(([, d]) => {
  const urls = [d.aside && d.aside.ctaUrl, d.cta && d.cta.primaryUrl].filter(Boolean).map((u) => u.replace(/^\//, '').split(/[?#]/)[0]);
  return urls.some((u) => trainings.has(u));
}).map(([k]) => k);
if (behToOpl.length) fail(`behandeling-CTA wijst naar opleiding-content: ${behToOpl.join(', ')}`);
else pass('geen behandeling-CTA naar opleiding-content');

// ---------- 20. Geen "Nog niet bekend"-placeholderdata in publieke content ----------
const nogNietBekend = contentFiles.filter((f) => /nog niet bekend/i.test(fs.readFileSync(f, 'utf8')));
if (nogNietBekend.length) fail(`placeholder "Nog niet bekend" in: ${nogNietBekend.map((f) => path.relative(ROOT, f)).join(', ')}`);
else pass('geen "Nog niet bekend"-placeholder in content');

// ---------- 21. Actueel team = exact Isabella + Carla (geen Leoni) ----------
const onsTeam = rd('content/nl/info.json')['ons-team'] || {};
const teamNames = (onsTeam.team || []).map((m) => m.name);
if (JSON.stringify(teamNames) !== JSON.stringify(['Isabella', 'Carla'])) {
  fail(`actueel team is ${JSON.stringify(teamNames)}, verwacht ["Isabella","Carla"]`);
} else pass('actueel team = Isabella + Carla');
if ((onsTeam.body || []).some((b) => /^leoni\b/i.test(b.heading || ''))) fail('Leoni staat nog als teambio in ons-team.body');
else pass('geen Leoni-teambio meer in ons-team');
if (JSON.stringify(onsTeam).match(/leoni/i)) fail('Leoni nog aanwezig in de ons-team-content');
else pass('geen "Leoni" meer in ons-team-content');

// ---------- 22. EN/NL forms-parity (field names identiek → backendcontract intact) ----------
const enFormsPath = path.join(ROOT, 'content/en/forms.json');
if (fs.existsSync(enFormsPath)) {
  const nlForms = rd('content/forms.json').forms || {};
  const enForms = JSON.parse(fs.readFileSync(enFormsPath, 'utf8')).forms || {};
  const nlSlugs = Object.keys(nlForms).sort();
  const enSlugs = Object.keys(enForms).sort();
  if (JSON.stringify(nlSlugs) !== JSON.stringify(enSlugs)) {
    fail(`EN forms-slugs wijken af: nl=${nlSlugs} en=${enSlugs}`);
  } else {
    const mismatched = nlSlugs.filter((s) => JSON.stringify((nlForms[s].fields || []).map((f) => f.name)) !== JSON.stringify((enForms[s].fields || []).map((f) => f.name)));
    if (mismatched.length) fail(`EN form field-names wijken af (backendcontract!): ${mismatched.join(', ')}`);
    else pass('EN/NL forms: identieke slugs + veldnamen (backendcontract intact)');
  }
} else pass('EN forms nog niet aangemaakt (staged)');

// ---------- 23. i18n-activatiegate: EN mag pas actief met complete content/en ----------
const i18n = rd('content/i18n.json');
if (Array.isArray(i18n.locales) && i18n.locales.includes('en')) {
  const nlFiles = fs.readdirSync(path.join(ROOT, 'content/nl')).filter((f) => f.endsWith('.json'));
  const missingEn = nlFiles.filter((f) => !fs.existsSync(path.join(ROOT, 'content/en', f)));
  if (missingEn.length) fail(`i18n activeert 'en' maar content/en mist: ${missingEn.join(', ')} (half-Engelse site)`);
  else pass('EN geactiveerd met complete content/en-pariteit');
} else pass('EN nog niet geactiveerd in i18n.json (activatie is de gedocumenteerde slotstap)');

// ---------- 24. Placeholder-legal: noindex + niet in sitemap ----------
const legalRoutes = ['algemene-voorwaarden', 'privacy-verklaring', 'opleidingen-voorwaarden'];
const legalNoindexMissing = legalRoutes.filter((r) => !/robots:\s*\{\s*index:\s*false/.test(fs.readFileSync(path.join(ROOT, `app/[locale]/${r}/page.tsx`), 'utf8')));
if (legalNoindexMissing.length) fail(`legal-routes zonder robots noindex: ${legalNoindexMissing.join(', ')}`);
else pass('placeholder-legal routes: robots index:false');
const sitemapSrc = fs.readFileSync(path.join(ROOT, 'app/sitemap.ts'), 'utf8');
if (/getLegalSlugs/.test(sitemapSrc)) fail('sitemap bevat nog legal-pagina\'s (placeholder-legal moet eruit)');
else pass('sitemap sluit placeholder-legal uit');

// ---------- 25. EN-content: geen Nederlandse UI-leftovers + structurele pariteit ----------
const enDir = path.join(ROOT, 'content/en');
if (fs.existsSync(enDir)) {
  const enJson = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));
  // Gecurate Nederlandse UI-frases die NOOIT in Engelse display-tekst horen (geen losse woorden).
  const dutchPhrases = /(Afspraak maken|Meer info|Beschikbaarheid opvragen|Veelgestelde [Vv]ragen|Bekijk behandelingen|Neem contact op|Boek een|Alle behandelingen|Klaar voor jouw|Onze behandelingen)/;
  const leftovers = [];
  for (const f of enJson) {
    if (f === 'site.json' || f === 'forms.json') { /* labels-only files: scan values below */ }
    const obj = JSON.parse(fs.readFileSync(path.join(enDir, f), 'utf8'));
    // Verzamel alleen display-tekst (sla url/image/logo/mapUrl/formSlug over).
    const texts = [];
    const skipKeys = new Set(['url', 'image', 'logo', 'mapUrl', 'formSlug', 'icon', 'primaryUrl', 'secondaryUrl', 'buttonUrl', 'linkUrl', 'bookingUrl', 'notificationEmail', 'email']);
    (function walk(v, key) {
      if (typeof v === 'string') { if (!skipKeys.has(key)) texts.push(v); }
      else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
      else if (v && typeof v === 'object') for (const [k, val] of Object.entries(v)) walk(val, k);
    })(obj, '');
    const hit = texts.find((t) => dutchPhrases.test(t));
    if (hit) leftovers.push(`${f}: "${hit.slice(0, 50)}"`);
  }
  if (leftovers.length) fail(`Nederlandse UI-leftover in EN-content: ${leftovers.join(' | ')}`);
  else pass(`geen Nederlandse UI-leftovers in ${enJson.length} EN-bestanden`);
  // Structurele pariteit: elk en-bestand met een nl-tegenhanger heeft dezelfde top-level keys.
  const parityMismatch = enJson.filter((f) => {
    const nlp = f === 'forms.json' ? path.join(ROOT, 'content/forms.json') : path.join(ROOT, 'content/nl', f);
    if (!fs.existsSync(nlp)) return false;
    const a = Object.keys(JSON.parse(fs.readFileSync(nlp, 'utf8'))).sort();
    const b = Object.keys(JSON.parse(fs.readFileSync(path.join(enDir, f), 'utf8'))).sort();
    return JSON.stringify(a) !== JSON.stringify(b);
  });
  if (parityMismatch.length) fail(`EN/NL top-level key-mismatch: ${parityMismatch.join(', ')}`);
  else pass('EN-bestanden hebben dezelfde top-level keys als NL');
} else pass('geen content/en (nog niet gestart)');

// ---------- 26. Batch 2 EN-content: info + locaties + shop parity/inhoud ----------
const enInfoPath = path.join(ROOT, 'content/en/info.json');
if (fs.existsSync(enInfoPath)) {
  const nlInfo = rd('content/nl/info.json');
  const enInfo = JSON.parse(fs.readFileSync(enInfoPath, 'utf8'));
  const nlIK = Object.keys(nlInfo).sort();
  const enIK = Object.keys(enInfo).sort();
  if (JSON.stringify(nlIK) !== JSON.stringify(enIK)) fail(`info.json NL/EN top-level keys wijken af: nl=${nlIK.length} en=${enIK.length}`);
  else pass(`info.json NL/EN key-pariteit (${nlIK.length} keys)`);
  // FAQ-lengtes per key gelijk (geen verdwenen FAQ door vertaling).
  const faqMismatch = nlIK.filter((k) => ((nlInfo[k].faq && nlInfo[k].faq.items) || []).length !== ((enInfo[k] && enInfo[k].faq && enInfo[k].faq.items) || []).length);
  if (faqMismatch.length) fail(`info EN mist FAQ-items t.o.v. NL bij: ${faqMismatch.join(', ')}`);
  else pass('info EN: geen verdwenen FAQ-items');
  // EN-team = exact Isabella + Carla (geen Leoni).
  const enTeam = ((enInfo['ons-team'] || {}).team || []).map((m) => m.name);
  if (JSON.stringify(enTeam) !== JSON.stringify(['Isabella', 'Carla'])) fail(`EN team is ${JSON.stringify(enTeam)}, verwacht ["Isabella","Carla"]`);
  else pass('EN team = Isabella + Carla');
  if (JSON.stringify(enInfo['ons-team'] || {}).match(/leoni/i)) fail('Leoni nog aanwezig in EN ons-team');
  else pass('geen Leoni in EN ons-team');
  // EN-teamfoto's = dezelfde mediarefs als NL (geen vervangende/verzonnen foto's).
  const nlImgs = ((nlInfo['ons-team'] || {}).team || []).map((m) => m.image);
  const enImgs = ((enInfo['ons-team'] || {}).team || []).map((m) => m.image);
  if (JSON.stringify(nlImgs) !== JSON.stringify(enImgs)) fail('EN team-mediarefs wijken af van NL');
  else pass('EN team gebruikt dezelfde mediarefs als NL');
  // Info-CTA-bestemmingen blijven gelijkwaardig (zelfde primaryUrl per key).
  const ctaMismatch = nlIK.filter((k) => (nlInfo[k].cta && nlInfo[k].cta.primaryUrl) !== (enInfo[k] && enInfo[k].cta && enInfo[k].cta.primaryUrl));
  if (ctaMismatch.length) fail(`info EN CTA-url wijkt af bij: ${ctaMismatch.join(', ')}`);
  else pass('info EN CTA-bestemmingen identiek aan NL');
} else pass('content/en/info.json nog niet aangemaakt (staged)');

const enLocPath = path.join(ROOT, 'content/en/locaties.json');
if (fs.existsSync(enLocPath)) {
  const nlLoc = rd('content/nl/locaties.json');
  const enLoc = JSON.parse(fs.readFileSync(enLocPath, 'utf8'));
  const nlLK = Object.keys(nlLoc).sort();
  const enLK = Object.keys(enLoc).sort();
  if (JSON.stringify(nlLK) !== JSON.stringify(enLK)) fail(`locaties.json NL/EN city-keys wijken af: nl=${nlLK.length} en=${enLK.length}`);
  else pass(`locaties.json NL/EN key-pariteit (${nlLK.length} steden)`);
  // Adressen NIET vertaald + geen extra/verzonnen fysieke vestigingen.
  const addrChanged = nlLK.filter((k) => (nlLoc[k].location || {}).address !== (enLoc[k] && enLoc[k].location && enLoc[k].location.address) || (nlLoc[k].location || {}).postcode !== (enLoc[k] && enLoc[k].location && enLoc[k].location.postcode));
  if (addrChanged.length) fail(`locatie-adres vertaald/gewijzigd bij: ${addrChanged.join(', ')}`);
  else pass('locatie-adressen ongewijzigd (niet vertaald)');
  const enAddresses = new Set(enLK.map((k) => (enLoc[k].location || {}).address));
  const nlAddresses = new Set(nlLK.map((k) => (nlLoc[k].location || {}).address));
  if (enAddresses.size > nlAddresses.size) fail('EN introduceert extra fysieke vestiging(en) t.o.v. NL');
  else pass('geen extra fysieke vestigingen in EN locaties');
  // Geen verzonnen "our studio in <stad>" service-area-fout.
  const locRaw = fs.readFileSync(enLocPath, 'utf8');
  const fakeStudio = enLK.filter((k) => k !== 'amsterdam' && new RegExp(`our studio in ${enLoc[k].city}\\b`, 'i').test(locRaw));
  if (fakeStudio.length) fail(`service-area-pagina claimt eigen studio: ${fakeStudio.join(', ')}`);
  else pass('service-area-steden claimen geen eigen fysieke studio');
} else pass('content/en/locaties.json nog niet aangemaakt (staged)');

const enShopPath = path.join(ROOT, 'content/en/shop.json');
if (fs.existsSync(enShopPath)) {
  const enShop = JSON.parse(fs.readFileSync(enShopPath, 'utf8'));
  if (Array.isArray(enShop.products) && enShop.products.length > 0) fail('EN shop.json bevat een productcatalogus (producten horen live uit de CMS)');
  else pass('EN shop.json bevat geen productcatalogus (products leeg)');
} else pass('content/en/shop.json nog niet aangemaakt (staged)');

// ---------- 27. Batch 2.5 — gedeelde UI locale-aware (i18n plumbing) ----------
const sectionsSrc = fs.readFileSync(path.join(ROOT, 'components/sections.tsx'), 'utf8');
// 27a. Geen zichtbare hardcoded Nederlandse UI meer in de generieke renderer: letterlijke
//      JSX-tekst (>...<) of string-literals ('...'/"...") van bekende NL labels/aria-labels.
const literalDutch = ['Bekijk op de kaart', 'Alle artikelen', 'Lees artikel', 'min lezen', 'Meer over dit onderwerp', 'Terug naar de blog', 'Vorig artikel', 'Volgend artikel', 'In dit artikel', 'Inhoudsopgave', 'Klantbeoordelingen', 'Vorige pagina', 'Volgende pagina', 'Paginering']
  .filter((s) => new RegExp(`(>\\s*${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*<|["']${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'])`).test(sectionsSrc));
if (literalDutch.length) fail(`hardcoded Nederlandse UI in components/sections.tsx: ${literalDutch.join(' | ')}`);
else pass('geen hardcoded Nederlandse UI-strings in components/sections.tsx');

// 27b. Geen NL_MONTHS-only datumimplementatie; locale-aware via Intl.
if (/NL_MONTHS/.test(sectionsSrc)) fail('sections.tsx bevat nog NL_MONTHS (moet locale-aware Intl-datum zijn)');
else if (!/Intl\.DateTimeFormat/.test(sectionsSrc)) fail('sections.tsx datumformattering is niet Intl-based');
else pass('datumformattering is locale-aware (Intl.DateTimeFormat, geen NL_MONTHS)');

// 27c. UI-labelbestanden bestaan voor NL + EN met identieke structuur.
const uiNlPath = path.join(ROOT, 'content/nl/ui.json');
const uiEnPath = path.join(ROOT, 'content/en/ui.json');
if (!fs.existsSync(uiNlPath) || !fs.existsSync(uiEnPath)) {
  fail('content/<locale>/ui.json ontbreekt voor nl en/of en');
} else {
  const uiNl = JSON.parse(fs.readFileSync(uiNlPath, 'utf8'));
  const uiEn = JSON.parse(fs.readFileSync(uiEnPath, 'utf8'));
  const shape = (o) => Object.entries(o)
    .filter(([k]) => !k.startsWith('$'))
    .map(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) && k !== 'categories' && k !== 'relatedLabels'
      ? `${k}:{${Object.keys(v).sort().join(',')}}`
      : k))
    .sort();
  if (JSON.stringify(shape(uiNl)) !== JSON.stringify(shape(uiEn))) fail('ui.json NL/EN structuur wijkt af');
  else pass('ui.json NL/EN: identieke labelstructuur');
  // 27d. Engelse UI-labels zijn echt Engels (steekproef), NL blijft Nederlands.
  if (uiEn.blog.readArticle === uiNl.blog.readArticle || /lezen|artikel|Bekijk|Vorige|Volgende/.test(JSON.stringify(uiEn.blog) + JSON.stringify(uiEn.pagination) + JSON.stringify(uiEn.common))) {
    fail('content/en/ui.json bevat nog Nederlandse UI-labels');
  } else pass('EN UI-labels zijn Engels; NL blijft Nederlands');
  // 27e. Stabiele categoriesleutels: EN categories-map dekt elke gebruikte NL-categorie.
  const blogCats = new Set(Object.values(rd('content/nl/blog.json').posts || {}).map((p) => (p.category || '').trim()).filter(Boolean));
  const missingCat = [...blogCats].filter((c) => !(c in uiEn.categories));
  if (missingCat.length) fail(`EN categories-labels ontbreken voor: ${missingCat.join(', ')}`);
  else pass('EN categories-map dekt alle gebruikte kennisbank-categorieën');
  // 27f. Related-link labels: elke NL related-URL heeft een EN label.
  const relUrls = new Set([...fs.readFileSync(path.join(ROOT, 'content/blog.ts'), 'utf8').matchAll(/url: '([^']+)'/g)].map((m) => m[1]));
  const missingRel = [...relUrls].filter((u) => !(u in uiEn.relatedLabels));
  if (missingRel.length) fail(`EN relatedLabels ontbreken voor: ${missingRel.join(', ')}`);
  else pass('EN relatedLabels dekken alle category-related URLs');
}

// 27g. Stabiele category-slug staat los van het (vertaalbare) label.
const blogSrc = fs.readFileSync(path.join(ROOT, 'content/blog.ts'), 'utf8');
if (!/function categorySlug/.test(blogSrc)) fail('categorySlug ontbreekt in content/blog.ts');
else pass('categorySlug bestaat (stabiele slug losgekoppeld van display-label via ui.categories)');

// 27i. Header/MobileMenu: geen hardcoded Nederlandse nav-/aria-labels meer.
const headerSrc = fs.readFileSync(path.join(ROOT, 'components/Header.tsx'), 'utf8');
const mobileSrc = fs.readFileSync(path.join(ROOT, 'components/MobileMenu.tsx'), 'utf8');
const navDutch = [];
if (/aria-label="Hoofdmenu"/.test(headerSrc)) navDutch.push('Header: Hoofdmenu');
if (/aria-label=\{?['"]?Menu (openen|sluiten)/.test(mobileSrc) || /['"]Menu openen['"]|['"]Menu sluiten['"]/.test(mobileSrc)) navDutch.push('MobileMenu: Menu openen/sluiten');
if (/aria-label="Sluiten"/.test(mobileSrc)) navDutch.push('MobileMenu: Sluiten');
if (/>\s*Alle \{item\.label/.test(mobileSrc) || /Alle \{item\.label\.toLowerCase/.test(mobileSrc)) navDutch.push('MobileMenu: hardcoded "Alle"-prefix');
if (/<span className="drawer-title">Menu<\/span>/.test(mobileSrc)) navDutch.push('MobileMenu: hardcoded "Menu"-titel');
if (navDutch.length) fail(`hardcoded Nederlandse nav-/aria-labels: ${navDutch.join(' | ')}`);
else pass('Header/MobileMenu nav-/aria-labels zijn locale-aware (via ui.menu)');

// 27h. Ambient locale wordt in de locale-layout gezet (geen client-side detectie).
const layoutSrc = fs.readFileSync(path.join(ROOT, 'app/[locale]/layout.tsx'), 'utf8');
if (!/setActiveLocale\(/.test(layoutSrc)) fail('app/[locale]/layout.tsx zet de actieve locale niet (setActiveLocale)');
else pass('locale-layout zet de actieve locale server-side (geen client-detectie)');

// ---------- 28. Batch 3 EN-content: services.json parity/inhoud ----------
const enSvcPath = path.join(ROOT, 'content/en/services.json');
if (fs.existsSync(enSvcPath)) {
  const nlSvc = rd('content/nl/services.json');
  const enSvc = JSON.parse(fs.readFileSync(enSvcPath, 'utf8'));
  const nkeys = Object.keys(nlSvc).sort();
  const ekeys = Object.keys(enSvc).sort();
  if (JSON.stringify(nkeys) !== JSON.stringify(ekeys)) fail(`services.json NL/EN keys wijken af: nl=${nkeys.length} en=${ekeys.length}`);
  else pass(`services.json NL/EN key-pariteit (${nkeys.length} behandelingen)`);
  const diffs = [];
  for (const k of nkeys) {
    const a = nlSvc[k] || {}; const b = enSvc[k] || {};
    const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    if (a.image !== b.image) diffs.push(`${k}:image`);
    if ((a.videoUrl ?? null) !== (b.videoUrl ?? null)) diffs.push(`${k}:videoUrl`);
    if ((a.productHandle ?? null) !== (b.productHandle ?? null)) diffs.push(`${k}:productHandle`);
    if ((a.body || []).length !== (b.body || []).length) diffs.push(`${k}:bodyLen`);
    if (!eq((a.body || []).map((x) => (x.checklist || []).length), (b.body || []).map((x) => (x.checklist || []).length))) diffs.push(`${k}:checklists`);
    if ((a.steps ? a.steps.items.length : -1) !== (b.steps ? b.steps.items.length : -1)) diffs.push(`${k}:steps`);
    if ((a.faq ? a.faq.items.length : -1) !== (b.faq ? b.faq.items.length : -1)) diffs.push(`${k}:faq`);
    if (((a.aside && a.aside.facts) || []).length !== ((b.aside && b.aside.facts) || []).length) diffs.push(`${k}:facts`);
    if ((a.aside && a.aside.ctaUrl) !== (b.aside && b.aside.ctaUrl)) diffs.push(`${k}:ctaUrl`);
    if ((a.cta && a.cta.primaryUrl) !== (b.cta && b.cta.primaryUrl)) diffs.push(`${k}:primaryUrl`);
    if ((a.cta && a.cta.secondaryUrl) !== (b.cta && b.cta.secondaryUrl)) diffs.push(`${k}:secondaryUrl`);
    if (!(b.hero && b.hero.title && b.hero.text)) diffs.push(`${k}:emptyHero`);
  }
  if (diffs.length) fail(`services EN structuur/URL/media-afwijking: ${diffs.slice(0, 12).join(', ')}${diffs.length > 12 ? ' …' : ''}`);
  else pass('services EN: image/CTA-URL/productHandle/body/steps/faq/facts pariteit + geen lege hero');
  // Geen verzonnen productHandle in EN (moet exact gelijk zijn aan NL — hierboven al afgedekt, hier expliciet).
  const fakeHandles = nkeys.filter((k) => (enSvc[k].productHandle ?? null) !== (nlSvc[k].productHandle ?? null));
  if (fakeHandles.length) fail(`services EN productHandle wijkt af/verzonnen: ${fakeHandles.join(', ')}`);
  else pass('services EN productHandles identiek aan NL (niets verzonnen)');
} else pass('content/en/services.json nog niet aangemaakt (staged)');

// ---------- 29. Batch 4 EN-content: trainings-detail.json parity/inhoud ----------
const enTrnPath = path.join(ROOT, 'content/en/trainings-detail.json');
if (fs.existsSync(enTrnPath)) {
  const nlTrn = rd('content/nl/trainings-detail.json');
  const enTrn = JSON.parse(fs.readFileSync(enTrnPath, 'utf8'));
  const nkeys = Object.keys(nlTrn);
  const ekeys = Object.keys(enTrn);
  if (JSON.stringify(nkeys) !== JSON.stringify(ekeys)) fail(`trainings-detail.json NL/EN keys/volgorde wijken af: nl=${nkeys.length} en=${ekeys.length}`);
  else pass(`trainings-detail.json NL/EN key-pariteit + volgorde (${nkeys.length} opleidingen)`);
  const diffs = [];
  for (const k of nkeys) {
    const a = nlTrn[k] || {}; const b = enTrn[k] || {};
    const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
    if (a.image !== b.image) diffs.push(`${k}:image`);
    if ((a.videoUrl ?? null) !== (b.videoUrl ?? null)) diffs.push(`${k}:videoUrl`);
    if ((a.productHandle ?? null) !== (b.productHandle ?? null)) diffs.push(`${k}:productHandle`);
    if (((a.highlights ?? null) && a.highlights.length) !== ((b.highlights ?? null) && b.highlights.length)) diffs.push(`${k}:highlights`);
    if ((a.body || []).length !== (b.body || []).length) diffs.push(`${k}:bodyLen`);
    if (!eq((a.body || []).map((x) => (x.checklist || []).length), (b.body || []).map((x) => (x.checklist || []).length))) diffs.push(`${k}:checklists`);
    if ((a.steps ? a.steps.items.length : -1) !== (b.steps ? b.steps.items.length : -1)) diffs.push(`${k}:steps`);
    if ((a.faq ? a.faq.items.length : -1) !== (b.faq ? b.faq.items.length : -1)) diffs.push(`${k}:faq`);
    if (((a.aside && a.aside.facts) || []).length !== ((b.aside && b.aside.facts) || []).length) diffs.push(`${k}:facts`);
    if ((a.aside && a.aside.ctaUrl) !== (b.aside && b.aside.ctaUrl)) diffs.push(`${k}:ctaUrl`);
    if ((a.cta && a.cta.primaryUrl) !== (b.cta && b.cta.primaryUrl)) diffs.push(`${k}:primaryUrl`);
    if ((a.cta && a.cta.secondaryUrl) !== (b.cta && b.cta.secondaryUrl)) diffs.push(`${k}:secondaryUrl`);
    if (!(b.hero && b.hero.title && b.hero.text)) diffs.push(`${k}:emptyHero`);
  }
  if (diffs.length) fail(`trainings EN structuur/URL/media-afwijking: ${diffs.slice(0, 12).join(', ')}${diffs.length > 12 ? ' …' : ''}`);
  else pass('trainings EN: image/videoUrl/CTA-URL/productHandle/highlights/body/steps/faq/facts pariteit + geen lege hero');
  const fakeHandles = nkeys.filter((k) => (enTrn[k].productHandle ?? null) !== (nlTrn[k].productHandle ?? null));
  if (fakeHandles.length) fail(`trainings EN productHandle wijkt af/verzonnen: ${fakeHandles.join(', ')}`);
  else pass('trainings EN productHandles identiek aan NL (niets verzonnen)');
} else pass('content/en/trainings-detail.json nog niet aangemaakt (staged)');

// ---------- 30. Batch 5 EN-content: blog.json parity/inhoud ----------
const enBlogPath = path.join(ROOT, 'content/en/blog.json');
if (fs.existsSync(enBlogPath)) {
  const nlBlog = rd('content/nl/blog.json');
  const enBlog = JSON.parse(fs.readFileSync(enBlogPath, 'utf8'));
  const nkeys = Object.keys(nlBlog.posts || {});
  const ekeys = Object.keys(enBlog.posts || {});
  if (JSON.stringify(nkeys) !== JSON.stringify(ekeys)) fail(`blog.json NL/EN post-keys/volgorde wijken af: nl=${nkeys.length} en=${ekeys.length}`);
  else pass(`blog.json NL/EN key-pariteit + volgorde (${nkeys.length} artikelen)`);
  const diffs = [];
  for (const k of nkeys) {
    const a = (nlBlog.posts || {})[k] || {};
    const b = (enBlog.posts || {})[k] || {};
    if (a.image !== b.image) diffs.push(`${k}:image`);
    if (a.author !== b.author) diffs.push(`${k}:author`);
    if (a.date !== b.date) diffs.push(`${k}:date`);
    if (a.category !== b.category) diffs.push(`${k}:category`);
    if ((a.status ?? null) !== (b.status ?? null)) diffs.push(`${k}:status`);
    if ((a.body || []).length !== (b.body || []).length) diffs.push(`${k}:bodyLen`);
    if (JSON.stringify((a.body || []).map((x) => (x.paragraphs || []).length)) !== JSON.stringify((b.body || []).map((x) => (x.paragraphs || []).length))) diffs.push(`${k}:paras`);
    if (JSON.stringify((a.body || []).map((x) => !!x.heading)) !== JSON.stringify((b.body || []).map((x) => !!x.heading))) diffs.push(`${k}:headings`);
    if (!(b.title && b.excerpt && (b.body || []).length)) diffs.push(`${k}:empty`);
  }
  if (diffs.length) fail(`blog EN structuur/media/categorie-afwijking: ${diffs.slice(0, 12).join(', ')}${diffs.length > 12 ? ' …' : ''}`);
  else pass('blog EN: image/author/date/category/body-pariteit + geen lege posts');
  const catChanged = nkeys.filter((k) => (nlBlog.posts[k] || {}).category !== (enBlog.posts[k] || {}).category);
  if (catChanged.length) fail(`blog EN category-keys vertaald (moeten NL blijven voor slug-pariteit): ${catChanged.join(', ')}`);
  else pass('blog EN category-keys blijven Nederlands (stabiele /kennisbank/<categorie>-slugs)');
  if ((enBlog.index && enBlog.index.cta && enBlog.index.cta.primaryUrl) !== (nlBlog.index && nlBlog.index.cta && nlBlog.index.cta.primaryUrl)
    || (enBlog.index && enBlog.index.cta && enBlog.index.cta.secondaryUrl) !== (nlBlog.index && nlBlog.index.cta && nlBlog.index.cta.secondaryUrl)) {
    fail('blog EN index CTA-URLs wijken af van NL');
  } else pass('blog EN index CTA-bestemmingen identiek aan NL');
  const leftoverRe = /\b(behandeling|opleiding|wenkbrauwen|nazorg|genezing|verwijderen|wanneer kies je|wat zijn de voordelen)\b/i;
  const leftover = nkeys.filter((k) => {
    const b = enBlog.posts[k] || {};
    const text = JSON.stringify({ title: b.title, excerpt: b.excerpt, seoTitle: b.seoTitle, seoDescription: b.seoDescription, body: b.body });
    return leftoverRe.test(text);
  });
  if (leftover.length) fail(`blog EN bevat Nederlandse leftovers in: ${leftover.slice(0, 8).join(', ')}`);
  else pass('blog EN: geen Nederlandse leftovers in vertaalde velden');
} else pass('content/en/blog.json nog niet aangemaakt (staged)');

// ---------- 31. Pre-live technical guards ----------
const checkoutSrc = fs.readFileSync(path.join(ROOT, 'app/api/commerce/checkout/route.ts'), 'utf8');
if (!/ZERO_PAYMENT/.test(checkoutSrc) || !/totalCents <= 0/.test(checkoutSrc)) {
  fail('checkout mist ZERO_PAYMENT_GUARD (totalCents <= 0 moet checkout blokkeren)');
} else pass('ZERO_PAYMENT_GUARD aanwezig in checkout-API');
if (!/localePathname\(locale, '\/afrekenen\/bedankt'/.test(checkoutSrc)) {
  fail('checkout returnUrl gebruikt geen localePathname (breekt hideDefaultPrefix EN-root)');
} else pass('checkout thank-you URL respecteert hideDefaultPrefix');

const checkoutFormSrc = fs.readFileSync(path.join(ROOT, 'components/commerce/CheckoutForm.tsx'), 'utf8');
if (!/cart\.totalCents <= 0/.test(checkoutFormSrc) || !/saved\.totalCents <= 0/.test(checkoutFormSrc)) {
  fail('CheckoutForm blokkeert €0-checkout niet client-side');
} else pass('CheckoutForm blokkeert €0-checkout client-side');

// ---------- 32. Checkout error i18n ----------
const checkoutErrorKeys = ['zeroPaymentBlocked', 'priceChanged', 'checkoutOutOfStock', 'paymentStatusUnknown'];
const nlShopUi = (rd('content/nl/shop.json').ui || {});
const enShopUi = (rd('content/en/shop.json').ui || {});
const missingNl = checkoutErrorKeys.filter((k) => !nlShopUi[k]);
const missingEn = checkoutErrorKeys.filter((k) => !enShopUi[k]);
if (missingNl.length) fail(`NL shop UI mist checkout-error keys: ${missingNl.join(', ')}`);
else pass('NL checkout error labels bestaan');
if (missingEn.length) fail(`EN shop UI mist checkout-error keys: ${missingEn.join(', ')}`);
else pass('EN checkout error labels bestaan');

const shopUiShape = (ui) => Object.keys(ui || {}).sort();
if (JSON.stringify(shopUiShape(nlShopUi)) !== JSON.stringify(shopUiShape(enShopUi))) {
  fail('shop UI NL/EN structuur wijkt af');
} else pass('shop UI NL/EN: identieke labelstructuur');

const hardcodedCheckoutNl = [
  'Het totaalbedrag is ongeldig. Checkout is geblokkeerd tot de prijs bekend is.',
  'Het totaalbedrag is gewijzigd. Controleer je bestelling en probeer het opnieuw.',
  'Niet alles is nog op voorraad. Pas je winkelwagen aan.',
].filter((s) => checkoutFormSrc.includes(s));
if (hardcodedCheckoutNl.length) fail(`CheckoutForm bevat nog hardcoded NL checkout-errors: ${hardcodedCheckoutNl.join(' | ')}`);
else pass('CheckoutForm bevat geen bekende hardcoded Nederlandse checkout-errors');

if (!/checkoutErrorLabel\(/.test(checkoutFormSrc) || /body\?\.error/.test(checkoutFormSrc)) {
  fail('CheckoutForm mapt errors niet via checkoutErrorLabel (of toont nog body.error)');
} else pass('CheckoutForm mapt API-codes via checkoutErrorLabel, niet via body.error');

const checkoutErrorSrc = fs.readFileSync(path.join(ROOT, 'lib/commerce/checkout-errors.ts'), 'utf8');
if (!/ZERO_PAYMENT/.test(checkoutErrorSrc) || !/PRICE_CHANGED/.test(checkoutErrorSrc) || !/OUT_OF_STOCK/.test(checkoutErrorSrc) || !/PAYMENT_STATUS_UNKNOWN/.test(checkoutErrorSrc)) {
  fail('checkout-errors.ts mist een of meer stabiele API-codes');
} else pass('checkout-errors.ts kent ZERO_PAYMENT / PRICE_CHANGED / OUT_OF_STOCK / PAYMENT_STATUS_UNKNOWN');

const checkoutCodeToKey = {
  ZERO_PAYMENT: 'zeroPaymentBlocked',
  PRICE_CHANGED: 'priceChanged',
  OUT_OF_STOCK: 'checkoutOutOfStock',
  PAYMENT_STATUS_UNKNOWN: 'paymentStatusUnknown',
};
const mapCheckoutError = (code, ui) => ui[checkoutCodeToKey[code]] || ui.genericError;
const expectedEn = {
  ZERO_PAYMENT: 'The total amount is invalid. Checkout is blocked until the price is available.',
  PRICE_CHANGED: 'The total amount has changed. Review your order and try again.',
  OUT_OF_STOCK: 'Some items are no longer available. Please update your cart.',
  PAYMENT_STATUS_UNKNOWN: "We couldn't verify your previous payment. Please try again in a few seconds.",
};
const expectedNl = {
  ZERO_PAYMENT: 'Het totaalbedrag is ongeldig. Checkout is geblokkeerd tot de prijs bekend is.',
  PRICE_CHANGED: 'Het totaalbedrag is gewijzigd. Controleer je bestelling en probeer het opnieuw.',
  OUT_OF_STOCK: 'Niet alles is nog op voorraad. Pas je winkelwagen aan.',
  PAYMENT_STATUS_UNKNOWN: 'We konden je vorige betaling even niet controleren. Probeer het over een paar seconden opnieuw.',
};
const dutchResidue = /Het totaalbedrag|Niet alles is nog op voorraad|winkelwagen|ongeldig|We konden je vorige betaling|Er ging iets mis/;
const enWrong = Object.entries(expectedEn).filter(([code, expected]) => mapCheckoutError(code, enShopUi) !== expected || dutchResidue.test(mapCheckoutError(code, enShopUi)));
const nlWrong = Object.entries(expectedNl).filter(([code, expected]) => mapCheckoutError(code, nlShopUi) !== expected);
if (enWrong.length) fail(`EN checkout-error mapping gebruikt geen Engelse UI: ${enWrong.map(([c]) => c).join(', ')}`);
else pass('EN mapping gebruikt Engelse UI');
if (nlWrong.length) fail(`NL checkout-error mapping gebruikt geen Nederlandse UI: ${nlWrong.map(([c]) => c).join(', ')}`);
else pass('NL mapping gebruikt Nederlandse UI');
if (mapCheckoutError('UNKNOWN', nlShopUi) !== nlShopUi.genericError || mapCheckoutError('UNKNOWN', enShopUi) !== enShopUi.genericError) {
  fail('onbekende checkout-error valt niet terug op genericError');
} else pass('onbekende checkout-error valt terug op ui.genericError');

const robotsSrc = fs.readFileSync(path.join(ROOT, 'app/robots.ts'), 'utf8');
if (!/['"]\/account['"]/.test(robotsSrc) || !/['"]\/preview\//.test(robotsSrc)) {
  fail('robots.ts mist unprefixed functional disallows voor hideDefaultPrefix EN-root');
} else pass('robots.ts disallows zowel /nl/… als clean EN functional paths');

const ervaringenSrc = fs.readFileSync(path.join(ROOT, 'app/[locale]/ervaringen/page.tsx'), 'utf8');
if (!/pageAlternates\(\s*'\/ervaringen'/.test(ervaringenSrc)) {
  fail('ervaringen-pagina mist pageAlternates (hreflang/canonical)');
} else pass('ervaringen generateMetadata gebruikt pageAlternates');

const notFoundSrc = fs.readFileSync(path.join(ROOT, 'app/not-found.tsx'), 'utf8');
if (!/getUI\(locale\)\.notFound/.test(notFoundSrc) || /<h1>Pagina niet gevonden<\/h1>/.test(notFoundSrc)) {
  fail('globale 404 is nog hardcoded Nederlands');
} else pass('globale 404 gebruikt locale-aware ui.notFound');

// ---------- Ombré training-detail v2: geen stale prijs-/locatieclaims; variant-deeplink ----------
const ombreNl = rd('content/nl/trainings-detail.json')['ombre-powder-brows-opleiding'];
const ombreEn = rd('content/en/trainings-detail.json')['ombre-powder-brows-opleiding'];
if (!ombreNl || !ombreEn) fail('ombre-powder-brows-opleiding ontbreekt in NL of EN trainings-detail');
else {
  const ombreText = JSON.stringify(ombreNl) + '\n' + JSON.stringify(ombreEn);
  const stalePrice = [
    /€\s*3[.\u00a0,]?000/,
    /€\s*3[.\u00a0,]?400/,
    /€\s*1[.\u00a0,]?400/,
    /€\s*1400/,
    /€\s*1[.\u00a0,]?250/,
    /€\s*550\b/,
    /€\s*1[.\u00a0,]?000/,
  ].filter((re) => re.test(ombreText));
  if (stalePrice.length) fail(`Ombré-pagina bevat nog stale prijsclaims: ${stalePrice.map((r) => r.source).join(', ')}`);
  else pass('Ombré NL+EN bevatten geen bekende stale cursusprijsclaims');

  const amsterdamOnly = /alleen in Amsterdam|uitsluitend in Amsterdam|wordt gegeven op onze locatie in Amsterdam|offered almost every month in Amsterdam|taught at our location in Amsterdam/i;
  if (amsterdamOnly.test(ombreText)) fail('Ombré-locatiecopy is nog Amsterdam-only');
  else pass('Ombré-locatiecopy is niet meer Amsterdam-only');

  const locLineNl = /Beschikbare locaties verschillen per opleidingsdatum\. Bekijk hieronder de actuele data en locaties\./;
  const locLineEn = /Available locations differ per course date\. See the current dates and locations below\./;
  const faqLocNl = (ombreNl.faq?.items || []).some((i) => locLineNl.test(i.a || ''));
  const faqLocEn = (ombreEn.faq?.items || []).some((i) => locLineEn.test(i.a || ''));
  if (!locLineNl.test(JSON.stringify(ombreNl)) || !faqLocNl) fail('Ombré NL mist canonieke locatiecopy in body/FAQ');
  else pass('Ombré NL locatiecopy staat in beschikbaarheid/FAQ');
  if (!locLineEn.test(JSON.stringify(ombreEn)) || !faqLocEn) fail('Ombré EN mist canonieke locatiecopy in body/FAQ');
  else pass('Ombré EN locatiecopy staat in beschikbaarheid/FAQ');

  if (/4 intensieve dagen|4 intensive days/i.test(ombreText)) fail('Ombré-copy noemt nog 4 dagen naast het 6-daagse programma');
  else pass('Ombré-copy is consistent over 6 dagen (geen 4-dagen-claim)');

  if (ombreNl.formSlug !== 'opleiding-interesse' || ombreEn.formSlug !== 'opleiding-interesse') {
    fail('Ombré-pilot mist inline formulier opleiding-interesse');
  } else pass('Ombré behoudt inline formulier opleiding-interesse');
  if (ombreNl.formPrefill?.opleiding !== 'wenkbrauwen' || !/ombr[eé] powder brows/i.test(ombreNl.formPrefill?.opleiding_specifiek || '')) {
    fail('Ombré NL formPrefill mist categorie/opleiding');
  } else pass('Ombré NL formPrefill zet categorie + opleiding');
}

// ---------- Training Detail v2 rollout (alle opleidingen, Ombré blijft de referentie) ----------
const trnNl = rd('content/nl/trainings-detail.json');
const trnEn = rd('content/en/trainings-detail.json');
const trnKeys = Object.keys(trnNl);
const CONTACT_ONLY = new Set(['prive-opleiding-permanente-make-up']);
const formCatValues = new Set(
  ((rd('content/forms.json').forms?.['opleiding-interesse']?.fields || []).find((f) => f.name === 'opleiding')?.options || [])
    .map((o) => o.value),
);
if (trnKeys.length < 18) fail(`trainings-detail heeft ${trnKeys.length} keys, verwacht minstens 18`);
else pass(`trainings-detail bevat ${trnKeys.length} opleidingen`);

const handles = [];
const stalePriceRe = /€\s*1[.\u00a0,]?500|€\s*2[.\u00a0,]?500|€\s*3[.\u00a0,]?000|€\s*3[.\u00a0,]?400|€\s*599\b|€\s*1[.\u00a0,]?000|€\s*1[.\u00a0,]?250|€\s*1[.\u00a0,]?400|t\.w\.v\.|worth €|valued at|Temporarily from €|Nu 40%|Now with 40%/i;
const amsterdamOnlyRe = /IZZI Beauty in Amsterdam|wordt gegeven op onze locatie in Amsterdam|offered almost every month in Amsterdam|taught at our location in Amsterdam/i;
const emptyFacts = [];
const missingV2 = [];
const deadCtas = [];
const mediaIssues = [];
const prefillIssues = [];
for (const k of trnKeys) {
  const a = trnNl[k]; const b = trnEn[k];
  const blob = `${JSON.stringify(a)}\n${JSON.stringify(b)}`;
  if (/Den Bosch/i.test(blob)) fail(`${k} bevat nog Den Bosch`);
  if (stalePriceRe.test(blob)) fail(`${k} bevat nog een stale cursusprijsclaim`);
  if (k !== 'prive-opleiding-permanente-make-up' && amsterdamOnlyRe.test(blob)) fail(`${k} heeft nog Amsterdam-only locatiecopy`);
  if (/aanbetaling binnen 3 dagen|deposit within 3 days/i.test(blob)) fail(`${k} hardcodet nog een aanbetalingstermijn`);
  for (const f of a.aside?.facts || []) if (!String(f.v || '').trim()) emptyFacts.push(`${k}:${f.k}`);
  for (const f of b.aside?.facts || []) if (!String(f.v || '').trim()) emptyFacts.push(`${k}:en:${f.k}`);
  const walk = (obj, acc = []) => {
    if (typeof obj === 'string') {
      if (/^https?:\/\/.*(wordpress|wp-content)/i.test(obj)) acc.push(obj);
      else if (obj.startsWith('/media/') && !/^\/media\/[A-Za-z0-9._-]+$/.test(obj)) acc.push(obj);
    } else if (Array.isArray(obj)) obj.forEach((x) => walk(x, acc));
    else if (obj && typeof obj === 'object') Object.values(obj).forEach((x) => walk(x, acc));
    return acc;
  };
  mediaIssues.push(...walk(a).map((m) => `${k}:${m}`));
  if (a.formSlug !== 'opleiding-interesse' || b.formSlug !== 'opleiding-interesse') missingV2.push(`${k}:formSlug`);
  if (!a.formPrefill?.opleiding_specifiek || !b.formPrefill?.opleiding_specifiek) prefillIssues.push(`${k}:opleiding_specifiek`);
  if (a.formPrefill?.opleiding && !formCatValues.has(a.formPrefill.opleiding)) prefillIssues.push(`${k}:cat:${a.formPrefill.opleiding}`);
  if ((a.formSlug && JSON.stringify(Object.keys(a.formPrefill || {}))) !== (b.formSlug && JSON.stringify(Object.keys(b.formPrefill || {})))) {
    prefillIssues.push(`${k}:prefillKeys`);
  }
  if (!!a.availability !== !!b.availability) missingV2.push(`${k}:availabilityParity`);
  if (JSON.stringify(a.gallery || []) !== JSON.stringify(b.gallery || [])) missingV2.push(`${k}:galleryParity`);
  if ((a.trainers || []).length !== (b.trainers || []).length) missingV2.push(`${k}:trainersParity`);
  if (CONTACT_ONLY.has(k)) {
    if (a.productHandle || b.productHandle || a.availability || b.availability) missingV2.push(`${k}:contact-only-lekte-commerce`);
    if (a.formPrefill?.prive_opleiding !== 'ja') prefillIssues.push(`${k}:prive_opleiding`);
    if (a.cta?.primaryUrl !== '#opleiding-interesse') deadCtas.push(`${k}:prive-primary`);
  } else {
    if (!a.productHandle || a.productHandle !== b.productHandle) missingV2.push(`${k}:productHandle`);
    else handles.push(a.productHandle);
    if (!a.availability || !b.availability) missingV2.push(`${k}:availability`);
    if (a.cta?.primaryUrl !== '#beschikbare-data' || a.cta?.secondaryUrl !== '#opleiding-interesse') deadCtas.push(`${k}:cta`);
    if (b.cta?.primaryUrl !== '#beschikbare-data' || b.cta?.secondaryUrl !== '#opleiding-interesse') deadCtas.push(`${k}:cta-en`);
  }
}
const dupHandles = handles.filter((h, i) => handles.indexOf(h) !== i);
if (dupHandles.length) fail(`dubbele productHandle: ${[...new Set(dupHandles)].join(', ')}`);
else pass(`${handles.length} unieke productHandles`);
const danglingFacts = [];
for (const k of trnKeys) {
  for (const loc of [trnNl[k], trnEn[k]]) {
    for (const f of loc.aside?.facts || []) {
      if (/\s[·—-]\s*$/.test(String(f.v || ''))) danglingFacts.push(`${k}:${f.k}=${f.v}`);
    }
  }
}
if (emptyFacts.length) fail(`lege aside-facts: ${emptyFacts.join(', ')}`);
else pass('geen lege aside-facts na prijsnormalisatie');
if (danglingFacts.length) fail(`afgekapte aside-facts: ${danglingFacts.join(', ')}`);
else pass('geen afgekapte euro-restanten in aside-facts');
if (missingV2.length) fail(`v2-pariteit/velden ontbreken: ${missingV2.slice(0, 12).join(', ')}`);
else pass('alle boekbare opleidingen hebben availability + productHandle; NL/EN gallery/trainers/availability-pariteit');
if (prefillIssues.length) fail(`form prefill: ${prefillIssues.join(', ')}`);
else pass('elke opleiding prefillt categorie + opleiding_specifiek (privé ook prive_opleiding=ja)');
if (deadCtas.length) fail(`dode/verkeerde CTA: ${deadCtas.join(', ')}`);
else pass('boekbare opleidingen: primary #beschikbare-data, secondary #opleiding-interesse');
if (mediaIssues.length) fail(`verdachte media-refs: ${mediaIssues.slice(0, 8).join(', ')}`);
else pass('geen WordPress-hotlinks of ongeldige /media/-paden in trainings-detail');
if (!CONTACT_ONLY.has('prive-opleiding-permanente-make-up') || handles.includes(undefined)) fail('contact-only set klopt niet');
else pass('privé-opleiding blijft contact-only');

const formDef = rd('content/forms.json').forms?.['opleiding-interesse'];
const formNames = (formDef?.fields || []).map((f) => f.name);
for (const name of ['opleiding', 'opleiding_specifiek', 'gewenste_locatie', 'gewenste_periode', 'prive_opleiding']) {
  if (!formNames.includes(name)) fail(`opleiding-interesse mist veld ${name}`);
}
if (formNames.includes('gewenste_locatie') && formNames.includes('prive_opleiding')) {
  pass('opleiding-interesse heeft locatie, periode en privé-velden');
}

const formSrc = fs.readFileSync(path.join(ROOT, 'components/Form.tsx'), 'utf8');
if (!/params\.get\(f\.name\)\s*\|\|\s*values\?\.\[f\.name\]/.test(formSrc)) {
  fail('Form prefill laat query params niet winnen van values');
} else pass('Form: query params overrulen values-prefill');
if (!/formRef\.current\?\.reset\(\)/.test(formSrc) || !/applyPrefill\(\)/.test(formSrc)) {
  fail('Form reset herstelt prefill niet');
} else pass('Form reset roept applyPrefill opnieuw aan');

const variantSrc = fs.readFileSync(path.join(ROOT, 'lib/commerce/variant-query.ts'), 'utf8');
const availSrc = fs.readFileSync(path.join(ROOT, 'components/TrainingAvailability.tsx'), 'utf8');
const atcSrc = fs.readFileSync(path.join(ROOT, 'components/commerce/AddToCart.tsx'), 'utf8');
const productPageSrc = fs.readFileSync(path.join(ROOT, 'app/[locale]/product/[handle]/page.tsx'), 'utf8');

if (!/export const VARIANT_QUERY = 'variant'/.test(variantSrc) || !/`\/product\/\$\{handle\}\?\$\{VARIANT_QUERY\}=/.test(variantSrc)) {
  fail('productVariantHref bouwt geen /product/<handle>?variant=<id>');
} else pass('availability-CTA-helper zet variant-ID in de query');
if (!/productVariantHref\(handle,\s*v\.id\)/.test(availSrc)) {
  fail('TrainingAvailability Aanmelden-CTA bevat geen variant-ID');
} else pass('TrainingAvailability Aanmelden-CTA bevat variant-ID');
if (/href=\{`\/product\/\$\{handle\}`\}/.test(availSrc) || /href=\{['"`]\/product\/\$\{/.test(availSrc)) {
  fail('TrainingAvailability linkt nog naar /product/<handle> zonder variant');
} else pass('TrainingAvailability deeplinkt niet meer zonder variant');
if (!/training-date-card--full/.test(availSrc) || !/labels\.full/.test(availSrc)) {
  fail('uitverkochte availability-kaart toont geen Vol-status');
} else pass('uitverkochte availability-kaart toont Vol zonder Aanmelden-knop');
if (!/pickInStockVariantId/.test(atcSrc) || !/initialVariantId/.test(atcSrc)) {
  fail('AddToCart leest geen URL-variant voor auto-select');
} else pass('AddToCart kan een geldige in-stock URL-variant auto-selecteren');
if (!/variant-option--active/.test(atcSrc) || !/aria-pressed=\{active\}/.test(atcSrc)) {
  fail('AddToCart markeert de gekozen variant niet zichtbaar');
} else pass('AddToCart markeert de gekozen variant (aria-pressed + active class)');
if (!/searchParams/.test(productPageSrc) || !/firstQueryValue\(query\.variant\)/.test(productPageSrc) || !/initialVariantId=\{requestedVariantId\}/.test(productPageSrc)) {
  fail('productpagina geeft ?variant= niet door aan AddToCart');
} else pass('productpagina leest ?variant= en geeft alleen het id door');
if (/priceCents.*searchParams|searchParams.*price/i.test(productPageSrc)) {
  fail('productpagina vertrouwt prijs uit queryparams');
} else pass('productpagina vertrouwt geen prijs/voorraad uit de query');

// Zuivere helper-tests tegen lib/commerce/variant-query.ts (echte module, strip-types).
const variantProbe = spawnSync(
  process.execPath,
  [
    '--experimental-strip-types',
    '--no-warnings',
    '--input-type=module',
    '-e',
    `
      import { productVariantHref, firstQueryValue, pickInStockVariantId, trainingOptionValues } from ${JSON.stringify(pathToFileURL(path.join(ROOT, 'lib/commerce/variant-query.ts')).href)};
      const variants = [
        { id: 11, inStock: true },
        { id: '22', inStock: false },
        { id: '33', inStock: true },
      ];
      const parsed = trainingOptionValues([
        { name: 'Datum', value: '12 okt 2026' },
        { name: 'Locatie', value: 'Rotterdam' },
      ]);
      const parsedEn = trainingOptionValues([
        { name: 'Date', value: '12 Oct 2026' },
        { name: 'Location', value: 'Amsterdam' },
      ]);
      const parsedFallback = trainingOptionValues([{ name: 'Groep', value: 'Ochtend' }]);
      const checks = {
        href: productVariantHref('opleiding-ombre-powder-brows', 33) === '/product/opleiding-ombre-powder-brows?variant=33',
        first: firstQueryValue(['33', 'x']) === '33' && firstQueryValue(undefined) === null && firstQueryValue('  ') === null,
        invalid: pickInStockVariantId(variants, 'nope') === null && pickInStockVariantId(variants, '22') === null,
        valid: pickInStockVariantId(variants, '33') === '33' && pickInStockVariantId(variants, '11') === '11',
        options: parsed.date === '12 okt 2026' && parsed.location === 'Rotterdam' && parsedEn.date === '12 Oct 2026' && parsedEn.location === 'Amsterdam' && parsedFallback.date === '' && parsedFallback.location === '',
      };
      console.log(JSON.stringify(checks));
    `,
  ],
  { encoding: 'utf8', cwd: ROOT },
);
if (variantProbe.status !== 0) {
  fail(`variant-query helper-test faalde: ${(variantProbe.stderr || variantProbe.stdout || '').trim()}`);
} else {
  let checks = {};
  try { checks = JSON.parse((variantProbe.stdout || '').trim()); } catch { checks = {}; }
  if (!checks.href) fail('productVariantHref serialiseert variant-ID niet in de query');
  else pass('productVariantHref bevat variant-ID');
  if (!checks.first) fail('firstQueryValue behandelt lege/ongeldige query niet als null');
  else pass('ongeldige/lege variantquery wordt genegeerd');
  if (!checks.invalid) fail('ongeldige of uitverkochte variantquery mag de kiezer niet forceren');
  else pass('ongeldige variantquery breekt de productkiezer niet');
  if (!checks.valid) fail('geldige in-stock variant wordt niet auto-geselecteerd');
  else pass('geldige in-stock variant kan automatisch geselecteerd worden');
  if (!checks.options) fail('trainingOptionValues herkent Datum/Date en Locatie/Location niet (of verzint data)');
  else pass('availability-kaarten herkennen Datum/Locatie via options[], anders leeg');
}

// ---------- OPEN (bekend geblokkeerd; GEEN pass, wel gerapporteerd) ----------
const warnings = [];
warnings.push('legal blijft noindex + uit sitemap tot jurist-review (NL gemigreerd van oude site, locaties opgeschoond; geen EN-legal.json)');
// EN-content nog niet compleet: collecties + locaties + info + legal ontbreken → EN blijft inactief (gate).
const enMissing = fs.existsSync(enDir) ? fs.readdirSync(path.join(ROOT, 'content/nl')).filter((f) => f.endsWith('.json') && !fs.existsSync(path.join(enDir, f))) : [];
if (enMissing.length) warnings.push(`content/en nog onvolledig (${enMissing.length} bestanden te vertalen: ${enMissing.join(', ')}) — EN blijft inactief tot compleet`);
// Team-media (Isabella/Carla) nog te uploaden via CMS (cloud agent kan dat niet).
warnings.push('teamfoto\'s Isabella + Carla nog uploaden via CMS Media (tenant izzi-beauty) — cloud agent heeft geen CMS-write/Mac-toegang');
// Juridische voorbeeldteksten (BLOCKED_CUSTOMER — geen goedgekeurde tekst).
const legalRaw = fs.readFileSync(path.join(ROOT, 'content/nl/legal.json'), 'utf8');
if (/voorbeeldtekst|vervang deze/i.test(legalRaw)) warnings.push('legal.json bevat nog voorbeeld-/placeholdertekst (BLOCKED_CUSTOMER: goedgekeurde juridische tekst nodig)');
// Online cursussen zonder eigen contentpagina (broncontent in geblokkeerde WooCommerce-producten).
const onlineWithoutPage = infoCards.length;
if (onlineWithoutPage) warnings.push(`${onlineWithoutPage} online cursus(sen) hebben nog geen eigen contentpagina (broncontent zit in geblokkeerde WooCommerce/LearnDash) — interim: prefilled info-aanvraag`);
// Absolute claims in behandelingen (bestaande goedgekeurde copy — markeren voor review).
const painless = Object.entries(svc).filter(([, d]) => JSON.stringify(d).match(/pijnloos/i)).map(([k]) => k);
if (painless.length) warnings.push(`absolute claim "pijnloos" in behandelingen (${painless.length}) — bestaande copy, markeren voor klant-/medische review, niet zelfstandig herschreven`);

// ---------- Rapport ----------
console.log(`\nIZZI content-regressietests: ${ok.length} checks OK, ${failures.length} fout(en), ${warnings.length} open (geblokkeerd).`);
for (const m of ok) console.log('  \u2713 ' + m);
if (warnings.length) {
  console.log('\nOPEN (bekend, geblokkeerd — NIET als PASS geteld):');
  for (const m of warnings) console.log('  \u26a0 ' + m);
}
if (failures.length) {
  console.error('\nREGRESSIES GEVONDEN:');
  for (const m of failures) console.error('  \u2717 ' + m);
  process.exit(1);
}
console.log('\nAlle harde content-regressietests geslaagd.');
