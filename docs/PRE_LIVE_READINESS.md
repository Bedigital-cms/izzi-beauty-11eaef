# IZZI Beauty — pre-live bilingual readiness

Date context: **19 September 2026**. Audited from verified `main` `2cde9c892c8231f1c61e2254ffcc08c683b57c90` plus the technical fixes in this PR.  
Committed production i18n **must stay off** until a separate activation PR.

Machine-readable crawl: [`docs/pre-live-route-inventory.json`](pre-live-route-inventory.json).

Status vocabulary (exactly one per item):

| Status | Meaning |
|---|---|
| **PASS** | Verified in this repo / local QA |
| **FAIL** | Concrete defect, owner + next action below |
| **BLOCKED_ACCESS** | This environment cannot prove it (CMS write, mailbox, Mollie sandbox, …) |
| **BLOCKED_CUSTOMER** | Needs a customer decision or approved copy |
| **DEFER_POST_LAUNCH** | Explicitly after cutover, not a launch blocker if accepted |

---

## Summary

| Status | count |
|---|---|
| PASS | 22 |
| FAIL | 0 |
| BLOCKED_ACCESS | 8 |
| BLOCKED_CUSTOMER | 12 |
| DEFER_POST_LAUNCH | 3 |

Launch-blocking until resolved or explicitly accepted: every **BLOCKED_CUSTOMER** legal/commerce/tracking item below, plus **BLOCKED_ACCESS** forms/Mollie/media E2E.

---

## Routing / i18n

| Item | Status | Notes / next action |
|---|---|---|
| Committed `content/i18n.json` production-safe (`enabled:false`, `defaultLocale:nl`, `locales:[nl]`, `hideDefaultPrefix:false`) | PASS | Do not flip in this PR. Owner: CMS toggle later. |
| Target architecture: EN on clean root, NL on `/nl` | PASS | Proxy Mode B already implements this when activation config is set. File: `proxy.ts`. |
| `/en`, `/en/`, `/en/blog`, `/en/powder-brows` → 301 to clean EN | PASS | Temporary bilingual HTTP QA (config **not** committed): `/en` → 301 `/`; `/en/blog` → 301 `/blog`; `/en/powder-brows` → 301 `/powder-brows`; `/en/blog?utm=qa` → 301 `/blog?utm=qa` (query preserved). `/en/` is Next’s 308 slash-normalise to `/en`, then 301 `/` — no loop. |
| EN root + NL prefix | PASS | `/` and `/blog` → `lang=en`, canonical `https://izzi-beauty.com` / `/blog`. `/nl` and `/nl/blog` → `lang=nl`, canonical `/nl` / `/nl/blog`. Reciprocal hreflang + `x-default` = clean EN. |
| No redirect loops on prefix strip + rewrite | PASS | Strip is 301 to unprefixed; unprefixed is internal rewrite (200), not a second redirect. |
| LanguageSwitcher omits `/en` when EN is default | PASS | `components/LanguageSwitcher.tsx` `swap()`. |
| Global 404 no longer hardcoded Dutch | PASS | `app/not-found.tsx` + `ui.notFound` (NL/EN). |
| Checkout thank-you URL respects `hideDefaultPrefix` | PASS | `app/api/commerce/checkout/route.ts` uses `localePathname`. |

**ACTIVATION_ROUTING_QA_REQUIRED** (next-phase slot PR, not this one):

```
enabled: true
defaultLocale: en
locales: [en, nl]
hideDefaultPrefix: true
```

Then prove in a real browser: `/` and `/blog` are EN; `/nl` and `/nl/blog` are NL; `/en/blog` 301 → `/blog`.

Owner of activation: CMS tenant toggle + a tiny dedicated PR. **Do not activate here.**

---

## SEO

| Item | Status | Notes / next action |
|---|---|---|
| Canonical origin `https://izzi-beauty.com` | PASS | `lib/seo.ts` `SITE_URL` fallback. Confirm Vercel env `NEXT_PUBLIC_SITE_URL` before activation (owner: platform). |
| Self-canonical + reciprocal hreflang + `x-default` = default locale | PASS | `buildAlternates()` / `pageAlternates()`. With activation config, `x-default` = clean EN. |
| `/ervaringen` metadata will emit alternates once content exists | PASS | `pageAlternates('/ervaringen')` added. Route 404s today (no `ervaringen` key). |
| Production sitemap count | PASS | **132** NL URLs (`/nl/…`). Legal excluded. Drafts excluded. |
| Simulated bilingual sitemap | PASS | **132 EN** clean-root + **132 NL** `/nl` = **264**. **0** `/en` URLs. **0** duplicates. **3** legal excluded. |
| Extra crawl (not in sitemap) | PASS | 13 knowledge-base category pages + 4 blog pagination pages → 149 EN + 149 NL crawl targets. |
| Robots: legal noindex | PASS | Page-level `index:false` on all three legal routes. |
| Robots: functional paths in clean-EN mode | PASS | `app/robots.ts` now disallows `/account`, `/preview/`, `/winkelwagen`, `/afrekenen`, `/order/` **and** the `/*/` variants. |
| Search Console | DEFER_POST_LAUNCH | Not in this phase. |

---

## Media

| Item | Status | Owner / next action |
|---|---|---|
| `/media/<filename>` → `cms.bedigital.ai/media/<filename>?tenant=izzi-beauty` | PASS | `app/media/[filename]/route.ts`. Do not change architecture. |
| Header/footer/home/treatment/training/blog/portfolio refs present | PASS | Content JSON points at `/media/…`. |
| Team photos actually uploaded in CMS Media | BLOCKED_ACCESS | Owner: IZZI via **CMS → Media**, tenant `izzi-beauty`. Cloud agent has no CMS-write. Layout uses `Media` placeholder if load fails — no broken third card. |
| Real-browser `naturalWidth > 0` on all heroes | BLOCKED_ACCESS | CMS TLS/media from this agent environment is not a reliable E2E proof. Re-run on Vercel preview + local Mac. |

---

## Legal — HARD BLOCKER

**BLOCKED_CUSTOMER_LEGAL**

| Route | noindex | sitemap | Copy |
|---|---|---|---|
| `/algemene-voorwaarden` | yes | excluded | Placeholder (“Dit is een voorbeeldtekst”) |
| `/privacy-verklaring` | yes | excluded | Placeholder |
| `/opleidingen-voorwaarden` | yes | excluded | Placeholder |
| `content/en/legal.json` | n/a | n/a | **Missing** — EN would fall back to NL if activated. Do **not** invent EN legal. |

### CUSTOMER LEGAL INPUT checklist

Owner: IZZI / advocaat. Do not publish until every row is filled with **approved** text.

- [ ] Definitieve bedrijfsentiteit / handelsnaam (IZZI Beauty BV vs Opleiding IZZI Beauty BV)
- [ ] KvK-nummer indien in de bron vereist
- [ ] Correcte adressen: Amsterdam Koningin Wilhelminaplein **13**, 1062 **HH**; Rotterdam Weena **95**, 3013 **CH** (oude legal-drafts noemen KWP 1 / 1062 HG — niet gebruiken)
- [ ] Algemene voorwaarden (behandelingen)
- [ ] Privacyverklaring (doeleinden, verwerkers, rechten)
- [ ] Opleidingenvoorwaarden
- [ ] Klachtenprocedure
- [ ] Betalingen / aanbetaling / in3 / BKR-formulering
- [ ] LearnDash / Online Academy access (geen “directe toegang” tenzij waar)
- [ ] Salonized (afspraken / persoonsgegevens)
- [ ] Laliqa / shopverwijzing
- [ ] Bewaartermijnen, formulieren, cookies/CMP

**Next action:** customer supplies final NL (+ EN) texts in CMS. Agent must not write legal copy.

---

## Forms

| Form | Wired | E2E submission |
|---|---|---|
| `contact` | PASS | BLOCKED_ACCESS |
| `uwv` | PASS | BLOCKED_ACCESS |
| `opleiding-interesse` | PASS | BLOCKED_ACCESS |
| `vacature` | PASS (text + e-mail CV) | BLOCKED_ACCESS |

Endpoint: `NEXT_PUBLIC_FORMS_ENDPOINT=https://cms.bedigital.ai` → `POST /forms/<slug>/submit`. Tenant from Origin host (`izzi-beauty.localhost` locally). No file upload — vacature CV remains e-mail to `info@izzi-beauty.com`.

**Next action:** owner platform + IZZI. From a machine that can reach the CMS: submit each form to a controlled mailbox, prove success + error path, no duplicates. Until then do **not** claim forms work E2E.

---

## Tracking

| Item | Status | Owner / next action |
|---|---|---|
| Salonized widget | PASS | Configured in `content/integrations.json` (`company` present). `trackingId` is Universal Analytics `UA-177261363-3` (legacy). |
| GTM | BLOCKED_CUSTOMER | Not in integrations. Add via CMS → Integraties if required. Do not paste snippets in pages. |
| GA4 | BLOCKED_CUSTOMER | Not configured (unless later via GTM). |
| CMP / CookieFirst | BLOCKED_CUSTOMER | Old site used CookieFirst; current tenant has **no** CMP provider. Confirm before EN indexation. |
| WhatsApp widget number `31612345678` | BLOCKED_CUSTOMER | Historical placeholder still in `integrations.json`. Public phone in content is `+31 6 11 76 88 81`. **Do not assume** that is the WhatsApp destination. **CUSTOMER_CONFIRM_WHATSAPP_NUMBER**. Change only via CMS → Integraties. |

---

## Commerce / Mollie — HARD LAUNCH BLOCKER

| Item | Status | Notes |
|---|---|---|
| `ZERO_PAYMENT_GUARD` | **PASS** | Storefront now rejects `totalCents <= 0` in `app/api/commerce/checkout/route.ts` (`code: ZERO_PAYMENT`) and disables the CheckoutForm submit. Prevents the old WooCommerce €0/deposit checkout. |
| 17 `productHandle`s `opleiding-*` + 1 contact-only (`prive-opleiding-permanente-make-up`) | PASS | NL/EN handles identical. Existence in CMS catalogue **not** proven here. |
| Mollie sandbox / deposit / full-pay / in3 / order-state E2E | BLOCKED_ACCESS | `NEXT_PUBLIC_COMMERCE_ENABLED=0` locally; `COMMERCE_API_KEY` only on Vercel. No production payment. |
| in3 presentation bounds | PASS | Client filter in `lib/commerce/in3.ts` (CMS still authoritative). |

**Next action:** owner platform. Enable commerce against **sandbox** Mollie, buy one paid training, one in3-in-range, one cancelled payment, prove deposit ≠ €0. Do not use live Mollie.

---

## LearnDash / Online Academy

| Item | Status | Owner / next action |
|---|---|---|
| No automatic provisioning code in this repo | PASS | Launch model = e-mail / ops handoff after purchase. |
| Customer-facing “direct toegang” / “na aanbetaling direct toegang” on several training pages | BLOCKED_CUSTOMER | Copy overclaims the manual handoff. Confirm or rewrite in CMS. Owner: IZZI. |
| Online hub: 8 cards → prefilled info form; only Airbrush has a product page | PASS | Matches interim model. |
| Login URL to old LearnDash | BLOCKED_CUSTOMER | No academy/login URL in content. Document the live subdomain before launch. Do not change LearnDash production from here. |

---

## Treatments (medical)

Source: `docs/izzi-en-services-medical-review.md`. **No claims rewritten.**

**BLOCKED_CUSTOMER** — confirm or accept before EN indexation:

- “Painless” / “pijnloos” (16 NL treatment pages still carry the word)
- No scarring / no scar tissue
- Suitable for every skin type
- Pregnancy
- Medication / blood thinners
- Healing and recovery times
- Guarantees
- Laser removal absolutes (“all colours”, “disappears completely”)
- Minimum age

Owner: IZZI + medical reviewer. Next action: tick the list in the existing review doc; only then index EN treatments.

---

## Trainings (customer decisions)

Source: `docs/izzi-en-trainings-review.md`. Compact list — **BLOCKED_CUSTOMER**:

- Current prices (not leftover WooCommerce)
- Current start dates
- Locations (Amsterdam / Rotterdam / online)
- Expired promo “through August 2026”
- Machine / starter-kit values (€550 / €1,250 etc.)
- Instalment tables
- in3 presentation
- BKR claims
- CRKBO / VAT-exempt wording
- Lifetime vs 90-day Online Academy access
- UWV / WW / WIA / Wajong availability
- All Round programme (current NL only — no old WP hours)
- Guest trainer “Linda Goldman & Isabella Levels”
- Current duration / planning

Owner: IZZI. Next action: one confirmation mail/sheet; do not present expired promos as current.

---

## Knowledge base / blog

Source: `docs/izzi-en-blog-review.md`. **BLOCKED_CUSTOMER** before EN indexation:

- Outdated promotions (Lucky 8 / €800)
- REACH 2022
- GGD fees / 3-year renewal
- Old price benchmarks (€300–€600)
- Pregnancy / aftercare medical copy
- Review-count / trust claims
- Old location claims
- CRKBO / UWV in articles

No editorial rewrite in this PR.

---

## Locations

| Item | Status | Notes |
|---|---|---|
| Amsterdam salon | PASS | Koningin Wilhelminaplein 13, 1062 HH Amsterdam — site/contact/home/footer. |
| Rotterdam salon address | PASS | Weena 95, 3013 CH Rotterdam in `site.json` / `contact.json` / `home.json`. |
| Rotterdam opening hours | BLOCKED_CUSTOMER | Empty on purpose. Do not invent. |
| Service-area cities (Haarlem, Utrecht, …) | PASS | No fake physical studio; they use the Amsterdam address block. |
| `/rotterdam` location card | BLOCKED_CUSTOMER | UX-gap, not a fake-studio bug: the page is a “Wenkbrauwen Rotterdam” **service-area** article whose `location` block is still **Amsterdam**. Footer/contact already list Weena 95. FAQ already says “studio in Amsterdam + a location in Rotterdam”. Owner: IZZI decides whether `/rotterdam` should show the Rotterdam salon card. Do not invent hours or rewrite without that decision. |

---

## Accessibility

**CUSTOMER_ACCESSIBILITY_DECISION_REQUIRED** — **BLOCKED_CUSTOMER**

Brand green `#21D19F` + white button text remains as previously chosen (~1.97:1). Not changed in this PR.

Options:

- **A.** Keep green, switch to dark text (`--brand-ink`)
- **B.** Keep white-on-green (accept contrast)
- **C.** Another approved green

Owner: IZZI. No redesign until that choice.

---

## Mobile

| Item | Status | Notes |
|---|---|---|
| Layout tokens / no runtime CSS-in-JS | PASS | `app/globals.css` only. |
| Full device sweep 360/390/430/768/1280 with live media | BLOCKED_ACCESS | Needs Vercel preview + real browser (this agent cannot reliably load CMS media or drive computer-use). Re-run on preview: homepage, mega menu, treatments, Powder Brows, opleidingen, All Round, online, prijzen, contact, team, kennisbank, long article, locaties, forms. Check overflow, CTA wrap, accordion, language switcher. |

---

## DNS / cutover

| Item | Status | Notes |
|---|---|---|
| No DNS change in this PR | PASS | |
| Old hosting / LearnDash subdomain cutover | DEFER_POST_LAUNCH | Separate runbook. |
| EN activation slot PR | DEFER_POST_LAUNCH | Only after launch-blocking BLOCKED_* items are resolved or accepted. |

---

## Technical fixes in this PR

1. `ZERO_PAYMENT_GUARD` on checkout API + CheckoutForm.
2. Checkout return URL uses `localePathname` (no forced `/en/afrekenen/bedankt` under hideDefaultPrefix).
3. `robots.ts` disallows clean EN functional paths.
4. `/ervaringen` `pageAlternates`.
5. Locale-aware global 404 via `ui.notFound`.
6. This matrix + route inventory.

Not changed: legal copy, prices, hours, WhatsApp number, medical/training/blog claims, CTA contrast, i18n activation, DNS, Mollie live.
