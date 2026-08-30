#!/usr/bin/env sh
# Reject git push of branches listed in scripts/push-deny-branches.txt.
# Git pre-push stdin: <local_ref> <local_oid> <remote_ref> <remote_oid>
set -eu

root="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
list="$root/scripts/push-deny-branches.txt"

denied=""
while IFS= read -r line || [ -n "${line:-}" ]; do
    case "$line" in
        "" | \#*) continue ;;
    esac
    denied="$denied $line"
done <"$list"

blocked=0
while read -r local_ref _local_oid remote_ref _remote_oid; do
    [ -n "${local_ref:-}" ] || continue
    local_branch="${local_ref#refs/heads/}"
    remote_branch="${remote_ref#refs/heads/}"
    for name in $denied; do
        if [ "$local_branch" = "$name" ] || [ "$remote_branch" = "$name" ]; then
            echo "✗ Refusing to push local-only branch '$name'." >&2
            echo "  Remove it from scripts/push-deny-branches.txt if that is intentional." >&2
            blocked=1
        fi
    done
done

if [ "$blocked" -ne 0 ]; then
    exit 1
fi
