#!/usr/bin/env bash
# Ejemplos con curl contra Frande ECF. Antes:
#   export FRANDE_ECF_KEY="foecf_test_..."   # tu credencial de pruebas
#   export FRANDE_ECF_ENV="TesteCF"
set -euo pipefail
BASE="https://ecf.frandeone.com/v1/${FRANDE_ECF_ENV:-TesteCF}"
H=(-H "X-API-Key: ${FRANDE_ECF_KEY:?define FRANDE_ECF_KEY}")

# 1. Probar la conexión (no emite)
curl -s "${H[@]}" "$BASE/cuenta"; echo

# 2. Validar sin enviar (no gasta la secuencia)
curl -s -X POST "${H[@]}" -H "Content-Type: application/json" \
  "$BASE/documentos-ecf?validate=true" --data @"$(dirname "$0")/../payloads/e31.json"; echo

# 3. Emitir (Idempotency-Key único por venta)
curl -s -X POST "${H[@]}" -H "Content-Type: application/json" -H "Idempotency-Key: venta-PED-2026-000123" \
  "$BASE/documentos-ecf" --data @"$(dirname "$0")/../payloads/e31.json"; echo

# 4. Consultar por tu referencia y por e-NCF
curl -s "${H[@]}" "$BASE/documentos-ecf/por-referencia/PED-2026-000123"; echo
curl -s "${H[@]}" "$BASE/documentos-ecf/por-encf/E310000000001"; echo

# 5. Descargar el PDF (cambia el ID por el internalTrackId de la emisión)
# curl -s "${H[@]}" -o factura.pdf "$BASE/documentos-ecf/<internalTrackId>/pdf"

# 6. Directorio DGII de un comprador
curl -s "${H[@]}" "$BASE/directorio/401000001"; echo
