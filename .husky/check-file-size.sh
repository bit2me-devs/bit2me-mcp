#!/usr/bin/env bash
# Pre-commit guard: bloquea archivos staged que superen el límite de tamaño.
#
# Motivación: evitar commits accidentales de binarios, dumps, vídeos, fixtures
# enormes, etc. que inflan el repositorio y rompen la experiencia de clone/CI.
#
# Configuración:
#   MAX_FILE_SIZE_BYTES (env, opcional). Por defecto 500 KB (512000 bytes).
#
# Para excepciones legítimas (lockfiles, snapshots grandes), añadirlas a la
# variable ALLOWED_LARGE_FILES separada por '|' (regex).

set -euo pipefail

MAX_FILE_SIZE_BYTES="${MAX_FILE_SIZE_BYTES:-512000}"
ALLOWED_LARGE_FILES="${ALLOWED_LARGE_FILES:-^pnpm-lock\.yaml$|^TOOLS_DOCUMENTATION\.md$|^CHANGELOG\.md$|^data/tools\.json$}"

staged_files=$(git diff --cached --name-only --diff-filter=ACMR -- || true)

if [ -z "${staged_files}" ]; then
    exit 0
fi

failed=0
while IFS= read -r file; do
    [ -z "${file}" ] && continue
    [ ! -f "${file}" ] && continue

    if [[ "${file}" =~ ${ALLOWED_LARGE_FILES} ]]; then
        continue
    fi

    size=$(wc -c <"${file}" | tr -d ' ')
    if [ "${size}" -gt "${MAX_FILE_SIZE_BYTES}" ]; then
        printf '\033[31mERROR\033[0m  %s — %d bytes (límite: %d)\n' \
            "${file}" "${size}" "${MAX_FILE_SIZE_BYTES}" >&2
        failed=1
    fi
done <<<"${staged_files}"

if [ "${failed}" -ne 0 ]; then
    cat >&2 <<EOF

Archivos staged superan el límite de tamaño (${MAX_FILE_SIZE_BYTES} bytes).
Opciones:
  1. Excluir el archivo del commit y guardarlo fuera del repo (LFS, storage).
  2. Añadirlo a ALLOWED_LARGE_FILES si su tamaño es legítimo.
  3. Sobrescribir temporalmente con MAX_FILE_SIZE_BYTES=<n> git commit ...
EOF
    exit 1
fi

exit 0
