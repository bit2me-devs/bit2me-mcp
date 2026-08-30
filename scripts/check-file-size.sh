#!/usr/bin/env bash
# scripts/check-file-size.sh — Auditoría de ficheros ≤200 líneas
#
# Uso:
#   bash scripts/check-file-size.sh              # informe (exit 0)
#   bash scripts/check-file-size.sh --strict     # falla si hay violaciones
#   bash scripts/check-file-size.sh --staged     # solo índice (pre-commit)
#   bash scripts/check-file-size.sh --summary    # solo totales
#   bash scripts/check-file-size.sh --max 200    # límite personalizado

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

MAX_LINES=200
STRICT=0
SUMMARY=0
STAGED=0

while [[ $# -gt 0 ]]; do
	case "$1" in
	--strict) STRICT=1; shift ;;
	--summary) SUMMARY=1; shift ;;
	--staged) STAGED=1; shift ;;
	--max)
		MAX_LINES="${2:?--max requiere un número}"
		shift 2
		;;
	-h | --help)
		echo "Uso: $0 [--strict] [--summary] [--staged] [--max N]"
		exit 0
		;;
	*)
		echo "Opción desconocida: $1" >&2
		exit 2
		;;
	esac
done

should_skip() {
	local path="$1"
	case "$path" in
	*/node_modules/* | node_modules/*) return 0 ;;
	*/build/* | build/*) return 0 ;;
	*/coverage/* | coverage/*) return 0 ;;
	landing/*) return 0 ;;
	.claude/* | .cursor/*) return 0 ;;
	esac
	case "$path" in
	*.ts | *.tsx | *.js | *.jsx | *.mjs | *.sh | *.py) ;;
	*) return 0 ;;
	esac
	return 1
}

is_exempt() {
	local path="$1"
	[[ -f "$path" ]] || return 1
	head -n 5 "$path" 2>/dev/null | grep -q 'file-size: exempt' || return 1
	return 0
}

violations=0
untracked_violations=0
checked=0

audit_file() {
	local path="$1" tag="$2"
	[[ -f "$path" ]] || return 0
	should_skip "$path" && return 0
	is_exempt "$path" && return 0
	local lines
	lines=$(wc -l <"$path" | tr -d ' ')
	checked=$((checked + 1))
	if [[ "$lines" -le "$MAX_LINES" ]]; then
		return 0
	fi
	if [[ -n "$tag" ]]; then
		untracked_violations=$((untracked_violations + 1))
		[[ "$SUMMARY" -eq 0 ]] && printf '%4d  %s  (%s)\n' "$lines" "$path" "$tag"
	else
		violations=$((violations + 1))
		[[ "$SUMMARY" -eq 0 ]] && printf '%4d  %s\n' "$lines" "$path"
	fi
}

if [[ "$STAGED" -eq 1 ]]; then
	while IFS= read -r -d '' path; do
		audit_file "$path" ""
	done < <(git diff --cached --name-only --diff-filter=ACMR -z)
else
	while IFS= read -r -d '' path; do
		audit_file "$path" ""
	done < <(git ls-files -z)
	while IFS= read -r -d '' path; do
		audit_file "$path" "untracked"
	done < <(git ls-files -z --others --exclude-standard)
fi

if [[ "$SUMMARY" -eq 1 ]]; then
	echo "checked=$checked violations=$violations untracked=$untracked_violations max=$MAX_LINES"
else
	echo ""
	echo "── Resumen: $violations violación(es) trackeadas >${MAX_LINES}L (de $checked; untracked=$untracked_violations) ──"
fi

if [[ "$violations" -gt 0 && "$STRICT" -eq 1 ]]; then
	exit 1
fi

exit 0
