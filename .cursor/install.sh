#!/usr/bin/env bash
# BE Digital customer website — Cloud Agent install (idempotent).
#
# Reusable pattern for any BE Digital customer website repository:
#   CUSTOMER WEBSITE            (primary work repo — this repository)
#   + BE Digital CMS repo       (reference / platform context)
#   + BE Digital architecture   (reference / docs context)
#
# The DEFAULT startup installs only this website and prepares safe dev/preview config.
# It does NOT start a local CMS or PostgreSQL — see .cursor/local-fullstack.sh for that
# (opt-in) — and it never writes to the production CMS (https://cms.bedigital.ai).
set -euo pipefail

SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SITE_DIR"

# Workspace root where sibling repos live (repositoryDependencies check them out here).
WORKSPACE_ROOT="$(cd "$SITE_DIR/.." && pwd)"

# Ensure a package manager is available (default cloud image ships pnpm; fall back to corepack).
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable pnpm >/dev/null 2>&1 || true
fi

echo "[install] Installing website dependencies (pnpm)…"
pnpm install --frozen-lockfile

# Make the BE Digital platform + architecture repos available for inspection/reference.
# repositoryDependencies (see environment.json) normally checks these out next to this repo;
# clone them read-only as a fallback so reference context is always present.
ensure_reference_repo() {
  local name="$1" url="$2"
  if [ -d "$WORKSPACE_ROOT/$name/.git" ]; then
    echo "[install] Reference repo present: $name"
  else
    echo "[install] Cloning reference repo: $name"
    git clone --depth 1 "$url" "$WORKSPACE_ROOT/$name" \
      || echo "[install] WARN: could not clone $name (may be provided at runtime)."
  fi
}
ensure_reference_repo "Be-digital-cms" "https://github.com/Bedigital-cms/Be-digital-cms"
ensure_reference_repo "bedigital-architecture" "https://github.com/BEBarry/bedigital-architecture"

# Safe development/preview defaults — DETERMINISTIC: always (re)write the Cloud-Agent-managed
# .env.local so every boot converges on the known-safe configuration, even on previously
# prepared disk state. This intentionally overwrites .env.local (it is generated + gitignored),
# which also discards any leftover overrides from an earlier `local-fullstack.sh` run.
#
# Safe defaults enforced here:
#   - form submissions disabled  -> ordinary development never writes to the production CMS;
#   - commerce/payments stay off  -> the committed .env keeps NEXT_PUBLIC_COMMERCE_ENABLED=0 and
#                                    no payment credentials exist in the repo;
#   - media stays read-only       -> served from the CMS base in the committed .env (cms.bedigital.ai),
#                                    which we deliberately do NOT override here.
echo "[install] Writing safe .env.local (deterministic; form submissions disabled locally)…"
cat > .env.local <<'EOF'
# GENERATED + MANAGED by .cursor/install.sh — do not edit by hand (overwritten on every install).
# .env.local is gitignored. Safe development/preview defaults for the BE Digital customer website:
#   - Media loads read-only from the CMS base defined in the committed .env (cms.bedigital.ai).
#   - Form submissions are disabled so normal development/preview never writes to the production CMS.
# For a full local stack (local CMS + PostgreSQL), run: bash .cursor/local-fullstack.sh
NEXT_PUBLIC_FORMS_ENDPOINT=
EOF

echo "[install] Done. The website dev server runs via the 'izzi-web' terminal (pnpm dev --port 3001)."
