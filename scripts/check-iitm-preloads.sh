#!/usr/bin/env bash
# check-iitm-preloads.sh
# Verifies that every DIRECTLY INSTALLED serverExternalPackage is pre-loaded
# in src/instrumentation.ts BEFORE sentry.server.config is imported.
# Prevents Sentry IITM Worker hang on Vercel Lambda cold start. ADR 82568b6e.
#
# Exemptions: create scripts/iitm-skip (one package per line, comments with #)
# for packages that cannot be pre-loaded (native binaries, very large executables).
#
# Usage: bash scripts/check-iitm-preloads.sh
# Exit codes: 0=pass  1=fail (violations found)

set -uo pipefail

NEXT_CONFIG="next.config.ts"
INSTRUMENTATION="src/instrumentation.ts"
SENTRY_SERVER="sentry.server.config.ts"
SKIP_FILE="scripts/iitm-skip"

# Not a Next.js project — skip silently
if [[ ! -f "$NEXT_CONFIG" ]]; then
  echo "SKIP: $NEXT_CONFIG not found"
  exit 0
fi

# Extract packages from serverExternalPackages: ['a', 'b'] — handles both quote styles
# Only single-line declarations are supported (standard NexusBlue pattern)
PACKAGES=$(grep -o "serverExternalPackages:[[:space:]]*\[[^]]*\]" "$NEXT_CONFIG" 2>/dev/null | \
  grep -oE "['\"][^'\"]+['\"]" | tr -d "'\"" | grep -v '^$' || true)

if [[ -z "$PACKAGES" ]]; then
  echo "PASS: No serverExternalPackages declared — nothing to check"
  exit 0
fi

# Build skip set from scripts/iitm-skip (strip comments + whitespace)
declare -A SKIP_SET
if [[ -f "$SKIP_FILE" ]]; then
  while IFS= read -r line; do
    pkg=$(echo "$line" | sed 's/#.*//' | awk '{print $1}')
    [[ -n "$pkg" ]] && SKIP_SET["$pkg"]=1
  done < "$SKIP_FILE"
fi

HAS_SENTRY=0
[[ -f "$SENTRY_SERVER" ]] && HAS_SENTRY=1

if [[ ! -f "$INSTRUMENTATION" ]]; then
  if [[ "$HAS_SENTRY" -eq 1 ]]; then
    echo "FAIL: $INSTRUMENTATION missing but Sentry is configured"
    echo "      Create $INSTRUMENTATION and pre-load all direct serverExternalPackages before sentry.server.config"
    echo "      Template: nexusblue-application-templates/src/instrumentation.ts  ADR 82568b6e"
    exit 1
  else
    echo "WARN: $INSTRUMENTATION missing (no Sentry yet — add it before enabling Sentry)"
    exit 0
  fi
fi

FAIL=0
SENTRY_LINE=$(grep -n "sentry\.server\.config" "$INSTRUMENTATION" 2>/dev/null | head -1 | cut -d: -f1 || true)

while IFS= read -r pkg; do
  [[ -z "$pkg" ]] && continue

  # Skip packages listed in iitm-skip (native binaries, oversized executables, etc.)
  if [[ -n "${SKIP_SET[$pkg]+x}" ]]; then
    echo "SKIP: '$pkg' — exempted in $SKIP_FILE"
    continue
  fi

  # Skip transitive dependencies — only directly installed packages can be safely
  # await import()'d in instrumentation.ts. Transitive deps load through their parent.
  if [[ -f "package.json" ]] && ! grep -q "\"${pkg}\"" package.json 2>/dev/null; then
    echo "SKIP: '$pkg' — transitive dependency (not in package.json)"
    continue
  fi

  # Match both single and double quotes
  PKG_LINE=$(grep -n "await import(['\"]${pkg}['\"])" "$INSTRUMENTATION" 2>/dev/null | head -1 | cut -d: -f1 || true)

  if [[ -z "$PKG_LINE" ]]; then
    if [[ "$HAS_SENTRY" -eq 1 ]]; then
      echo "FAIL: '$pkg' not pre-loaded in $INSTRUMENTATION"
      echo "      Add:  await import('$pkg')  before the sentry.server.config import"
      echo "      Why:  cold start loads '$pkg' after IITM Worker activates → Lambda hangs until timeout"
      echo "      Exempt: add '$pkg' to $SKIP_FILE if it cannot be pre-loaded (native binary, etc.)"
      echo "      ADR:  82568b6e"
      FAIL=1
    else
      echo "WARN: '$pkg' not pre-loaded (no Sentry yet — add it before enabling Sentry, ADR 82568b6e)"
    fi
  else
    if [[ "$HAS_SENTRY" -eq 1 && -n "$SENTRY_LINE" ]]; then
      if [[ "$PKG_LINE" -gt "$SENTRY_LINE" ]]; then
        echo "FAIL: '$pkg' pre-loaded at line $PKG_LINE — AFTER sentry.server.config at line $SENTRY_LINE"
        echo "      Pre-load must come BEFORE Sentry.init() — move the import up. ADR 82568b6e."
        FAIL=1
      else
        echo "PASS: '$pkg' — line $PKG_LINE (before sentry at line $SENTRY_LINE)"
      fi
    else
      echo "PASS: '$pkg' — pre-loaded"
    fi
  fi
done <<< "$PACKAGES"

echo ""
if [[ "$FAIL" -eq 1 ]]; then
  echo "IITM pre-load check FAILED — fix instrumentation.ts before merging. ADR 82568b6e."
  exit 1
fi

echo "IITM pre-load check PASSED."
exit 0
