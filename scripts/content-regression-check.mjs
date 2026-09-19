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

// ---------- OPEN (bekend geblokkeerd; GEEN pass, wel gerapporteerd) ----------
const warnings = [];
warnings.push('legal EN+NL = BLOCKED_CUSTOMER_LEGAL (placeholdertekst; noindex + uit sitemap tot goedgekeurde teksten)');
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
