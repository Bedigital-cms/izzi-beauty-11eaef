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

## Default startup (safe by default)

`install.sh` + the `izzi-web` terminal:

- install the website's dependencies (`pnpm install --frozen-lockfile`);
- make the CMS and architecture repositories available for inspection;
- write a safe `.env.local` (gitignored): media loads read-only from the production CMS
  (`https://cms.bedigital.ai`), while **form submissions are disabled** so ordinary development
  never writes to the production CMS;
- start the website dev server on port `3001` (open `http://izzi-beauty.localhost:3001`).

The default path never starts a local CMS or PostgreSQL, never changes production DNS, and never
uses production payment credentials (commerce is disabled via the repo `.env`).

## Optional: full local stack

Only when a task genuinely needs a local CMS, run manually from the repo root:

```sh
bash .cursor/local-fullstack.sh
```

This starts `Be-digital-cms` + its PostgreSQL dependency + this website (pointed at the local CMS on
`:3000` via `.env.local`), still without touching the production CMS. To return to the default safe
mode, remove `.env.local` and re-run `bash .cursor/install.sh`.
