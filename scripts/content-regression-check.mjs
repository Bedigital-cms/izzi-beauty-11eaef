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
  ['Kennisbank', '/kennisbank'],
  ['Webshop', 'https://laliqa.com'],
  ['Over IZZI', '/over-izzi'],
  ['Laserontharen', 'https://izziclinic.nl'],
];
const actualNav = site.nav.map((i) => [i.label, i.url]);
if (JSON.stringify(actualNav) !== JSON.stringify(expectedNav)) {
  fail(`nav-volgorde/bestemmingen wijken af:\n  verwacht: ${JSON.stringify(expectedNav)}\n  gevonden: ${JSON.stringify(actualNav)}`);
} else pass('nav-volgorde + externe Webshop/Laserontharen correct');

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

// ---------- 5. Footer: e-mail, geen Den Bosch, Blogs -> Kennisbank ----------
const footer = site.footer;
if (footer.email !== 'info@izzi-beauty.com') fail(`footer e-mail is ${footer.email}, verwacht info@izzi-beauty.com`);
if ((footer.locations || []).some((l) => /den bosch|hertogenbosch/i.test(`${l.name} ${l.city}`))) fail('Den Bosch staat nog als actieve footer-locatie');
const infoCol = (footer.columns || []).find((c) => c.heading === 'Informatie');
if ((infoCol?.links || []).some((l) => l.label === 'Blogs' || l.url === '/blog')) fail('footer heeft nog "Blogs"/"/blog" i.p.v. Kennisbank');
if (!(infoCol?.links || []).some((l) => l.label === 'Kennisbank' && l.url === '/kennisbank')) fail('footer mist Kennisbank -> /kennisbank');
if (!failures.some((m) => m.startsWith('footer'))) pass('footer e-mail/locaties/Kennisbank correct');

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

// ---------- 7. Formulier-submit knop niet meer in de gouden gradient ----------
const css = fs.readFileSync(path.join(ROOT, 'app/globals.css'), 'utf8');
const submitRule = css.match(/\.form button\[type="submit"\]\s*\{[^}]*\}/);
if (submitRule && /linear-gradient\(.*var\(--gold\)/.test(submitRule[0])) fail('.form submit-knop gebruikt nog de gouden gradient');
else pass('.form submit-knop niet meer goud');

// ---------- Rapport ----------
console.log(`\nIZZI content-regressietests: ${ok.length} checks OK, ${failures.length} fout(en).`);
for (const m of ok) console.log('  \u2713 ' + m);
if (failures.length) {
  console.error('\nREGRESSIES GEVONDEN:');
  for (const m of failures) console.error('  \u2717 ' + m);
  process.exit(1);
}
console.log('\nAlle content-regressietests geslaagd.');
