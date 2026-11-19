<!-- Generado desde https://ecf.frandeone.com/developers/docs/referencia.html · no editar a mano: se regenera desde el ECF -->


# Referencia y registro de cambios

_Esta documentación explica cómo usar la API; la referencia dice, ruta por ruta, qué recibe y qué devuelve._

## Referencia de la API

- [Referencia interactiva (Scalar)](https://ecf.frandeone.com/api-docs): cada ruta pública, con sus parámetros, cuerpos y respuestas, y la posibilidad de armar el pedido.
- [`/openapi.json`](https://ecf.frandeone.com/openapi.json): la especificación OpenAPI 3, sin sesión. Solo describe el contrato público de `/v1`; ninguna ruta interna.

Base: `https://ecf.frandeone.com/v1`. Todo lo que no está en el contrato público responde 404 JSON bajo `/v1`. Cambios que rompan la compatibilidad irán a `/v2`, con 12 meses de convivencia; un código de error o un campo existente no se renombra dentro de `/v1`.

## llms.txt

Un índice en texto plano de esta documentación, pensado para herramientas de IA y para quien prefiere leer sin navegador: [`/llms.txt`](https://ecf.frandeone.com/llms.txt) (el mismo contenido está en [`/developers/docs/llms.txt`](https://ecf.frandeone.com/developers/docs/llms.txt)).

## Registro de cambios

| Fecha | Cambio |
|---|---|
| 2026-10-08 | Primera edición de esta documentación pública (`/developers/docs`) y de `llms.txt`. |
| 2026-10-08 | Contrato público `/v1`: lista cerrada de rutas para integradores; el documento OpenAPI público (`/openapi.json`) solo describe esas rutas. |
| 2026-10-08 | Credenciales por ambiente: `foecf_test_`, `foecf_live_` y `foecf_dev_`, con rotación con gracia de 0, 24 horas o 7 días. La credencial decide el ambiente. |
| 2026-10-08 | Cuatro formas de enviar la clave: `X-API-Key`, `Authorization: Bearer`, `Authorization` sin Bearer y `ApiKey`. |
| 2026-10-08 | `GET /v1/{env}/cuenta` (probar la conexión, solo lectura) y `GET /v1/{env}/pruebas-integracion` (los 12 casos de prueba del sandbox). |
| 2026-10-08 | Consultas nuevas: `por-encf`, `por-referencia`, paginación por `cursor`, `/{env}/anulaciones`, y los campos `referencia_externa` y `sucursal` al emitir. |
| 2026-10-08 | Catálogo de errores estable y `Idempotency-Key` en emitir, anular, aprobar y rechazar; obligatoria con credenciales `foecf_*`. JSON mal formado: 400 `INVALID_JSON`; cuerpo grande: 413 `PAYLOAD_TOO_LARGE`. |
| 2026-10-08 | Webhooks por ambiente: destinos de pruebas y de producción separados, eventos a elegir, secreto de firma, y aviso del estado final de cada documento una sola vez. |

Lo marcado «Próximamente» en estas páginas no está disponible todavía: la numeración asignada por el ECF, la carga del certificado por enlace, los avisos de plazos de contingencia, los eventos `contingency.*` y `quota.threshold`, y el portal de developers.

## Glosario

| Término | Significado |
|---|---|
| e-CF | Comprobante fiscal electrónico, firmado digitalmente. |
| e-NCF | Número del e-CF: `E`, 2 dígitos de tipo y 10 de secuencia. |
| RFCE | Resumen de factura de consumo electrónica: lo que se envía a la DGII en un E32 menor de RD$ 250,000. |
| ANECF | Anulación de rangos de e-NCF que no se usaron. |
| ARECF | Acuse de recibo de un e-CF recibido. |
| ACECF | Aprobación comercial de un e-CF recibido. |
| TesteCF, CerteCF, eCF | Ambientes de pruebas, de certificación y de producción de la DGII. |
| RNC | Registro Nacional del Contribuyente (9 u 11 dígitos). |
| OFV | Oficina Virtual de la DGII. |
| DGII | Dirección General de Impuestos Internos. |

## Soporte

Escribe a [info@frandeone.com](mailto:info@frandeone.com) o llama al 809-765-3566. Incluye siempre el `requestId` de la respuesta que te dio problemas.
