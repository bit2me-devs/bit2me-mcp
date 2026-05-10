#!/usr/bin/env bash
# Warn (but never block) when the local `.env` file has overly permissive
# Unix permissions. The file holds API credentials (BIT2ME_API_KEY /
# BIT2ME_API_SECRET) and should be readable only by the owner.
#
# This hook is intentionally non-blocking: the `.env` file is not part of
# the repository, so a bad mode does not put the codebase at risk; the
# warning is for the developer's local hygiene.

set -u

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
  exit 0
fi

# stat differs between GNU coreutils (Linux) and BSD (macOS).
if mode=$(stat -c '%a' "$ENV_FILE" 2>/dev/null); then
  :
elif mode=$(stat -f '%Lp' "$ENV_FILE" 2>/dev/null); then
  :
else
  exit 0
fi

case "$mode" in
  600|400)
    exit 0
    ;;
  *)
    echo ""
    echo "WARNING: $ENV_FILE has permissions $mode (expected 600)."
    echo "         The file contains API credentials. Run:"
    echo "             chmod 600 $ENV_FILE"
    echo ""
    ;;
esac

exit 0
