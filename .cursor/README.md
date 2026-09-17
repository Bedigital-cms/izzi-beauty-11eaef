# Cloud Agent environment — BE Digital customer website

This directory configures the Cursor Cloud Agent environment for this customer website. It follows
the reusable **BE Digital customer website** pattern:

```
CUSTOMER WEBSITE REPO   (primary work repo — this repository)
+ BE Digital CMS repo    (reference / platform context)
+ BE Digital architecture (reference / docs context)
```

Each customer website keeps its own `.cursor/environment.json` in its own repository.

## Repository roles

| Repository | Role | Modify? |
| --- | --- | --- |
| `Bedigital-cms/izzi-beauty-11eaef` | Primary work repo — where implementation happens | Yes |
| `Bedigital-cms/Be-digital-cms` | Reference/platform context (tenant impl., forms, media, integrations, tracking, domains, content sync, visual editing, Site Contract) | No, unless the task explicitly requests a platform change |
| `BEBarry/bedigital-architecture` | Reference/docs only (Site Contract, architecture/migration conventions, guardrails) | No, unless the task explicitly requests a platform change |

All three repositories are made available to the agent via `repositoryDependencies` (with a clone
fallback in `install.sh`) so the CMS and architecture repos can be inspected for reference.

## Default startup (safe + deterministic)

`install.sh` + the `izzi-web` terminal:

- install the website's dependencies (`pnpm install --frozen-lockfile`);
- make the CMS and architecture repositories available for inspection;
- **deterministically (re)write** a safe `.env.local` (gitignored) on every install, so the
  environment always converges on the known-safe configuration — even on previously prepared disk
  state — and any leftover `local-fullstack.sh` overrides are discarded. In this safe default:
  media loads **read-only** from the CMS base in the committed `.env` (`https://cms.bedigital.ai`),
  and **form submissions are disabled**, so ordinary development never writes to the production CMS;
- start the website dev server on port `3001` (open `http://izzi-beauty.localhost:3001`).

The default path never starts a local CMS or PostgreSQL, never changes production DNS, and never
uses production payment credentials (commerce is disabled via the repo `.env`).

## Optional: full local stack

Only when a task genuinely needs a local CMS, run manually from the repo root:

```sh
bash .cursor/local-fullstack.sh
```

This runs the CMS repo's own idempotent bootstrap once (PostgreSQL + CMS deps + seed — it also
starts PostgreSQL, so it is not started twice), then starts `Be-digital-cms` on `:3000` and this
website on `:3001` (pointed at the local CMS via `.env.local`), still without touching the
production CMS. Ctrl-C stops both. To return to the default safe mode, just re-run
`bash .cursor/install.sh` (it overwrites `.env.local` back to the safe default).

## Reusable pattern vs. customer-specific configuration

When copying this to a new BE Digital customer website, keep the split below.

**Generic (copy as-is):**

- `install.sh` — logic is repo-agnostic: installs the current repo's deps, ensures the two BE
  Digital platform repos are available, and writes the safe default `.env.local` (forms disabled,
  media read-only from the repo's committed CMS base).
- `local-fullstack.sh` — same opt-in local full-stack flow for any customer site.
- The two `repositoryDependencies` (`Be-digital-cms`, `bedigital-architecture`) — platform repos,
  identical for every customer site.

**Customer-specific (adjust per repo):**

- `environment.json` → `name`, the dev-server `command`, and `ports[].port` (this site uses `3001`).
- The committed root `.env` (CMS base URL, tenant slug, commerce flag) — owned per customer site.

No customer-specific values are hard-coded in the generic scripts.
