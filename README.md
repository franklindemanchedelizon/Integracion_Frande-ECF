# Integración Frande ECF

Guía, contrato y SDK para integrar cualquier sistema (ERP, punto de venta, tienda en línea, app) con **Frande ECF**, el servicio de facturación electrónica (e-CF) de Frande One para la **DGII de República Dominicana**.

Tu sistema envía el comprobante en JSON. Frande ECF lo convierte a XML, lo **firma** con el certificado digital de tu empresa, genera el código de seguridad y el QR, lo **envía a la DGII**, sigue su estado y te avisa por webhook. Tú no manejas certificados, firmas ni el protocolo de la DGII.

| | |
|---|---|
| API | `https://ecf.frandeone.com/v1` |
| Documentación interactiva | https://ecf.frandeone.com/api-docs |
| Contrato OpenAPI 3.0 | [`openapi/frande-ecf-v1.openapi.json`](openapi/frande-ecf-v1.openapi.json) (también en https://ecf.frandeone.com/openapi.json) |
| Portal (cuenta, credenciales, certificado, webhooks) | https://ecf.frandeone.com |
| SDK TypeScript / Node | [`sdk/typescript`](sdk/typescript) |
| SDK PHP | [`sdk/php`](sdk/php) |

---

## 1. Cómo empezar

1. **Crea tu cuenta** en https://ecf.frandeone.com con el RNC de tu empresa.
2. **Sube tu certificado digital** (`.p12`) desde el portal. Lo emite una entidad autorizada (por ejemplo DigiFirma). Frande ECF lo guarda cifrado; nunca viaja por la API.
3. **Crea tus credenciales de API** en el portal, sección *Credenciales de API*:
   - `foecf_test_...` para **pruebas** (`TesteCF`).
   - `foecf_live_...` para **producción** (`eCF`), cuando tu cuenta esté habilitada.
4. **Prueba la conexión** con `GET /v1/TesteCF/cuenta` (sección 3).
5. **Completa los casos de prueba de integración** (`GET /v1/TesteCF/pruebas-integracion`): son 12 casos, 8 obligatorios. Cuando `listo_para_produccion` sea `true`, pasa a `eCF`.

## 2. Ambientes

El ambiente va en la ruta, justo después de `/v1`:

| Ambiente | Ruta | Para qué | Valor fiscal |
|---|---|---|---|
| `TesteCF` | `/v1/TesteCF/...` | Desarrollo y pruebas | Ninguno |
| `eCF` | `/v1/eCF/...` | Producción | Sí |

La credencial de pruebas solo funciona en `TesteCF` y la de producción solo en `eCF`. Si los mezclas, la API responde `403`.

## 3. Autenticación

Envía tu credencial en el encabezado **`X-API-Key`** (recomendado). También se acepta como `Authorization: Bearer <clave>`, `Authorization: <clave>` o `ApiKey: <clave>`.

```bash
curl -s https://ecf.frandeone.com/v1/TesteCF/cuenta \
  -H "X-API-Key: $FRANDE_ECF_KEY"
```

La respuesta trae tu RNC, el ambiente efectivo, la credencial usada y el estado de tu certificado. Esta consulta nunca emite nada.

Guarda la clave en una variable de entorno o en un gestor de secretos, **nunca en el código ni en el repositorio**.

## 4. Formato de las respuestas

```json
{ "success": true,  "data": { ... }, "requestId": "uuid" }
{ "success": false, "error": { "code": "ECF_VALIDATION_FAILED", "message": "..." }, "requestId": "uuid" }
```

Guarda el `requestId`: es lo que soporte necesita para rastrear una petición. La lista completa de códigos de error está en el contrato OpenAPI (`components.schemas.ErrorCode`).

## 5. Emitir un e-CF

`POST /v1/{env}/documentos-ecf`

- **El número e-NCF lo pones tú**, desde las secuencias que la DGII autorizó a tu empresa. Frande ECF no reserva números en producción.
- Encabezado **`Idempotency-Key`** obligatorio: un valor único por venta (de 8 a 128 caracteres). Si repites la petición con la misma clave y el mismo cuerpo, recibes la misma respuesta (`Idempotent-Replayed: true`) y no se emite dos veces.
- Campo opcional **`referencia_externa`**: el identificador de la venta en tu sistema. Si lo reenvías, la API devuelve el documento que ya existe (`duplicado_por_referencia: true`).
- Con `?validate=true` solo se valida: no se envía a la DGII ni se gasta la secuencia.

```bash
curl -s -X POST https://ecf.frandeone.com/v1/TesteCF/documentos-ecf \
  -H "X-API-Key: $FRANDE_ECF_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: venta-000123" \
  --data @ejemplos/payloads/e31.json
```

Respuesta inmediata (la DGII se procesa en segundo plano):

```json
{
  "success": true,
  "data": {
    "rnc": "130000001",
    "ecf": "E310000000001",
    "internalTrackId": "6f1c…",
    "securityCode": "A1B2C3",
    "qr_url": "https://ecf.dgii.gov.do/…",
    "signedDate": "2026-04-15T14:03:22Z",
    "isRFCE": false
  }
}
```

Con `securityCode` y `qr_url` ya puedes imprimir la representación impresa. El resultado de la DGII llega después por webhook o por consulta (sección 6).

**Tipos de e-CF:** 31 Crédito Fiscal · 32 Consumo · 33 Nota de Débito · 34 Nota de Crédito · 41 Compras · 43 Gastos Menores · 44 Regímenes Especiales · 45 Gubernamental · 46 Exportaciones · 47 Pagos al Exterior. Las facturas de consumo (32) menores de RD$250,000 se envían como resumen (RFCE), y la API lo resuelve sola.

Ejemplos de cuerpo en [`ejemplos/payloads`](ejemplos/payloads).

## 6. Consultar

| Operación | Ruta |
|---|---|
| Por e-NCF | `GET /v1/{env}/documentos-ecf/por-encf/{encf}` |
| Por tu referencia | `GET /v1/{env}/documentos-ecf/por-referencia/{ref}` |
| Por ID interno | `GET /v1/{env}/documentos-ecf/{internalTrackId}` |
| Estado en vivo ante la DGII | `GET /v1/{env}/documentos-ecf/{internalTrackId}/status` |
| Varios a la vez | `POST /v1/{env}/documentos-ecf/batch-status` |
| PDF (representación impresa) | `GET /v1/{env}/documentos-ecf/{internalTrackId}/pdf` |
| XML firmado | `GET /v1/{env}/documentos-ecf/{internalTrackId}/xml` |
| Listado | `GET /v1/{env}/documentos-ecf` |

Estados de la DGII: **Aceptado**, **Aceptado Condicional** (válido, con observaciones), **Rechazado** (corrige y vuelve a emitir) y **En proceso**.

## 7. Otras operaciones

- **Anular secuencias no usadas (ANECF):** `POST /v1/{env}/anulacion-ecf`.
- **Recepción:** `GET /v1/{env}/documentos-recibidos` y su XML, su acuse (ARECF) y la **aprobación o rechazo comercial** (ACECF): `POST /v1/{env}/documentos-recibidos/{id}/approve` o `/reject`.
- **Directorio DGII:** `GET /v1/{env}/directorio/{rnc}` dice si un comprador recibe e-CF electrónicamente.
- **Certificado:** `GET /v1/{env}/certificates/info` y `POST /v1/{env}/certificates/test-auth` (prueba la autenticación con la DGII sin emitir).

## 8. Webhooks

Configura uno o varios destinos por ambiente en el portal (*Credenciales de API*). Cada aviso trae:

| Encabezado | Contenido |
|---|---|
| `X-ECF-Event` | `ecf.accepted`, `ecf.conditionally_accepted`, `ecf.rejected`, `ecf.status_update`, `ecf.received`, `ecf.commercial_status`, `ecf.buyer_delivery`, `anecf.completed`, `certificate.expiring` |
| `X-ECF-Signature` | `sha256=` + HMAC-SHA256 en hex de `timestamp.nonce.cuerpo` con el secreto del destino |
| `X-ECF-Timestamp` | Segundos Unix. Rechaza si difiere más de 5 minutos de tu reloj |
| `X-ECF-Nonce` | Único por entrega. Rechaza uno ya visto |
| `X-ECF-Environment`, `X-ECF-Delivery-Id` | Ambiente e identificador de la entrega |

Responde `2xx` rápido y procesa después. Si fallas, se reintenta a los 1, 5, 30, 120 y 720 minutos. Los dos SDK traen la verificación de la firma lista.

## 9. Límites

Emisión: 30 por minuto por cuenta. Al pasarte recibes `429` con `Retry-After`. Las respuestas `5xx`, `408` y `429` no quedan guardadas por la idempotencia: reintenta con la misma `Idempotency-Key`.

## 10. Contingencia (qué hacer si algo falla)

Resumen del *Instructivo de Contingencia de Facturación Electrónica* de la DGII y del Decreto 587-24 (arts. 39 a 43). La guía completa está en [`docs/contingencia.md`](docs/contingencia.md).

| Qué falla | Qué pasa | Qué haces tú |
|---|---|---|
| **La DGII** no responde o está en mantenimiento | Frande ECF ya firmó tu e-CF (código de seguridad y QR válidos), lo guarda y lo envía solo cuando la DGII vuelve | Nada. Imprime normal |
| **Tu conexión** a Frande ECF | Tu sistema no recibe la firma | Reintenta con la **misma** `Idempotency-Key`. Si no se recupera, sigue la fila de abajo |
| **No puedes emitir e-CF** (corte prolongado) | Contingencia formal | Tu empresa declara la **entrada en contingencia** en la Oficina Virtual de la DGII (Facturación Electrónica → Contingencia FE), emite comprobantes **serie B** autorizados (máximo 15 días), declara la **salida** y, en 30 días, envía los e-CF que **reemplazan** esos comprobantes (código de modificación 4, solo a la DGII) |

## 11. SDK

- **TypeScript / Node 18+:** [`sdk/typescript`](sdk/typescript)
- **PHP 8.1+:** [`sdk/php`](sdk/php)

Para otros lenguajes, genera un cliente desde [`openapi/frande-ecf-v1.openapi.json`](openapi/frande-ecf-v1.openapi.json) con OpenAPI Generator o con la herramienta de tu preferencia.

## 12. Soporte

- Portal: https://ecf.frandeone.com
- Correo: soporte@frandeone.com
- Teléfono / WhatsApp: 809-765-3566

Incluye siempre el `requestId` de la respuesta.

---

Frande One es un producto de Frande Connection SRL, San Pedro de Macorís, República Dominicana.
