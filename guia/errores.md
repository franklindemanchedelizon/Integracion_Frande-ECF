<!-- Generado desde https://ecf.frandeone.com/developers/docs/errores.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Catálogo de errores

_Toda respuesta de error tiene la misma forma, y el `code` es estable._

## La forma de un error

```json
{
  "success": false,
  "error": {
    "code": "ECF_VALIDATION_FAILED",
    "message": "Validación fallida",
    "details": {
      "validationErrors": [
        "Campo obligatorio 'eNCF' faltante para tipo E31"
      ]
    }
  },
  "requestId": "8b1f0a6e-0c58-4b54-9b57-2f6d4d0a0e16"
}
```

- `error.code`: el código estable. **Programa tu lógica contra el `code`**, no contra el `message`: el mensaje está en español, puede ser más específico que el de la tabla y puede cambiar. El `code` no cambia sin pasar a una versión nueva (`/v2`, con 12 meses de convivencia).
- `error.details`: opcional. En validaciones trae `validationErrors`, la lista de campos a corregir (hasta 20).
- `requestId`: identificador de la petición. Si envías `X-Request-Id` el ECF usa tu valor. **Cítalo siempre al pedir soporte.**

## Qué reintentar

- Los errores marcados **reintentables** pueden desaparecer si repites la misma petición (con la misma `Idempotency-Key`). Los demás piden cambiar algo antes.
- Trata cualquier `5xx` o respuesta que no sea JSON como reintentable: un intermediario puede devolver su propia página de error.
- En un `429` espera los segundos de `Retry-After`.

## Controlar los errores desde tu sistema

Hay dos momentos, y cada uno se trata distinto. Guarda siempre el `requestId`, el `code` y los mensajes: con eso tu sistema decide solo y tú puedes mostrarlo a tu cliente.

### 1. Al enviar: el ECF responde con error

El documento no se firmó ni se gastó el número. Lee `error.code`, muestra `error.details.validationErrors` y corrige. Si el código es reintentable, repite con la misma `Idempotency-Key`.

### 2. Después: la DGII responde

Una respuesta 2xx al emitir significa que el ECF lo recibió, no que la DGII lo aceptó. El resultado llega por [webhook](webhooks.md) o consultando `GET /v1/{ambiente}/documentos-ecf/{internal_track_id}/status`, que le pregunta a la DGII en ese momento:

```json
{
  "success": true,
  "data": {
    "encf": "E310000000123",
    "estado_dgii": "rechazado",
    "dgii_code": "2",
    "dgii_message": "Número de secuencia no autorizada",
    "dgii_live": {
      "codigo": 2,
      "estado": "Rechazado",
      "secuenciaUtilizada": false,
      "mensajes": [
        {
          "codigo": 135,
          "valor": "Número de secuencia no autorizada"
        }
      ]
    }
  },
  "requestId": "8b1f0a6e-0c58-4b54-9b57-2f6d4d0a0e16"
}
```

| Código DGII | Estado | Qué debe hacer tu sistema |
|---|---|---|
| `1` | Aceptado | Marcar como aceptado. |
| `2` | Rechazado | Guardar `mensajes`, corregir y emitir de nuevo. Con `secuenciaUtilizada: false` el número se puede reutilizar; con `true`, usa otro. |
| `3` | En proceso | Volver a consultar más tarde. No reenvíes. |
| `4` | Aceptado condicional | Es válido. Guarda los `mensajes` y corrige la causa en los próximos. |

Los `mensajes` traen el código y el texto exactos de la DGII: guárdalos tal cual para tu registro de errores. En [Emitir un e-CF](emitir.md#errores) están los más frecuentes y cómo evitarlos.

## Los códigos

Buscar un código de error

| Código | HTTP | Reintentable | Qué significa | Qué hacer |
|---|---|---|---|---|
| `ACCOUNT_PROBE_FAILED` | 500 | Sí | No se pudo leer la cuenta. | Repite en unos segundos. |
| `ACCOUNT_SUSPENDED` | 402 | No | Cuenta suspendida por saldo. | Regulariza el pago. La emisión de e-CF sigue activa. |
| `ACECF_DGII_ERROR` | 424 | Sí | La DGII no aceptó la aprobación comercial. | Revisa `data` (estado y mensaje de la DGII) y reenvía la misma decisión. |
| `ACECF_ERROR` | 500 | Sí | No se pudo procesar la aprobación comercial. | Repite; si persiste, informa el requestId a soporte. |
| `ACECF_PERSIST_FAILED` | 500 | Sí | No se pudo guardar la aprobación comercial. | Repite con la misma Idempotency-Key. |
| `ALREADY_PROCESSED` | 409 | No | El documento ya tiene una decisión comercial. | Consulta el estado actual; solo se reenvía la misma decisión si falló el envío. |
| `ANECF_ERROR` | 500 | Sí | La anulación no se pudo procesar. | Revisa los rangos y repite con la misma Idempotency-Key. |
| `ANECF_SECUENCIA_INVALIDA` | 422 | No | Rango inválido: desde es mayor que hasta. | Corrige el orden del rango. |
| `ANECF_TIPO_CRUZADO` | 422 | No | El rango mezcla tipos de e-CF. | Un rango debe ser de un solo tipo. |
| `ANECF_TIPO_MISMATCH` | 422 | No | El rango no corresponde al tipo de e-CF indicado. | Alinea tipo_ecf con el prefijo de los e-NCF del rango. |
| `ANECF_TOO_MANY_GROUPS` | 400 | No | Demasiados tipos de comprobante en una sola anulación. | Divide la solicitud en varias. |
| `ANECF_TOO_MANY_SEQUENCES` | 400 | No | Demasiados rangos en una sola anulación. | Divide la solicitud en varias. |
| `API_KEY_INVALID` | 401 | No | Clave inválida, revocada o cuenta inactiva. | Revisa la clave en la sección API del portal; si fue rotada o revocada, crea una nueva. |
| `API_KEY_MISSING` | 401 | No | Falta la clave de la API. | Envía la clave en X-API-Key (o Authorization: Bearer <clave>, o ApiKey). |
| `BAD_REQUEST` | 400 | No | Petición mal formada. | Revisa el cuerpo contra el contrato. |
| `CERTIFICATION_RECEIPT_ONLY` | 409 | No | En CerteCF solo se registra el acuse de recibo; no se envía una decisión ACECF. | Continúa la prueba de certificación en el portal DGII. La aprobación comercial de producción no aplica a este ambiente. |
| `CERT_EXPIRED` | 400 | No | El certificado digital está vencido. | Sube un certificado vigente. |
| `CERT_INCOMPLETE` | 500 | No | El certificado no trae todos los datos necesarios. | Vuelve a subir el certificado .p12. |
| `CERT_NOT_FOUND` | 400 | No | No hay certificado activo. | Sube el certificado .p12 desde el portal. |
| `CERT_PRECHECK_FAILED` | 500 | Sí | No se pudo verificar el certificado. | Repite con la misma Idempotency-Key. |
| `CERT_SESSION_CLIENT_NOT_LINKED` | 403 | No | Ese RNC no es un cliente de esta cuenta de revendedor. | Solo una cuenta developer puede pedir el enlace de carga de los clientes que creó o tiene vinculados. |
| `CERT_SESSION_EMAIL_FAILED` | 502 | Sí | No se pudo enviar el enlace de carga por correo al dueño del cliente. | Repite la petición en unos minutos; el enlace anterior ya no sirve. |
| `CERT_SESSION_INVALID` | 404 | No | El enlace de carga del certificado no es válido, ya se usó o venció. | Pide un enlace nuevo; cada enlace sirve una sola vez y vence a los 30 minutos. |
| `CERT_UPLOAD_NOT_ALLOWED_FOR_KEY` | 403 | No | Una credencial foecf_* no puede subir ni cambiar el certificado. | El .p12 lo sube el dueño de la cuenta: pide un enlace con POST /{env}/certificados/sesion-carga y ábrelo en su navegador. |
| `DGII_QUERY_FAILED` | 502 | Sí | No se pudo consultar a la DGII. | Repite más tarde; el documento sigue en tu cuenta. |
| `DGII_SEND_ERROR` | 502 | Sí | No se pudo enviar a la DGII. | Repite más tarde con la misma Idempotency-Key. |
| `DGII_TIMEOUT` | 500 | Sí | La DGII no respondió a tiempo. | Repite más tarde. |
| `DGII_TOKEN_EXTRACT_FAILED` | 502 | Sí | No se pudo leer el token de la DGII. | Repite más tarde. |
| `DGII_TOKEN_MISSING` | 502 | Sí | La DGII no devolvió token de autenticación. | Repite más tarde. |
| `DOCUMENT_ENVIRONMENT_UNKNOWN` | 409 | No | El ambiente original del recibido requiere revisión. | Revisa la evidencia del documento recibido; no lo reenvíes en otro ambiente. |
| `DOC_NOT_FOUND` | 404 | No | Documento recibido no encontrado. | Verifica encf y rnc_emisor. |
| `ECF_VALIDATION_FAILED` | 400 | No | El documento no pasó la validación de campos. | Corrige cada línea de `details.validationErrors` y repite. |
| `ECF_XSD_INVALID` | 400 | No | El XML armado no cumple el esquema oficial de la DGII. | Revisa el orden, los nombres y los decimales de los campos. |
| `EMAIL_NOT_VERIFIED` | 403 | No | El correo de la cuenta aún no está verificado. | Verifica el correo desde el portal y vuelve a intentar. |
| `EMIT_RATE_LIMIT` | 429 | Sí | Límite de emisión alcanzado (30 por minuto). | Espera Retry-After y repite con la misma Idempotency-Key. |
| `ENCF_ALREADY_ISSUED` | 409 | No | Ese e-NCF ya se emitió con otro contenido. | Usa el siguiente número libre de tu rango. |
| `ENCF_CONSUMED` | 409 | No | Ese e-NCF ya fue consumido (rechazado o anulado) y no se reutiliza. | Usa el siguiente número libre de tu rango. |
| `ENVIRONMENT_MISMATCH` | 403 | No | La cuenta no opera en el ambiente de la ruta. | Corrige el ambiente de la URL al que indica `details.expected`. |
| `ENVIRONMENT_NOT_ALLOWED_FOR_KEY` | 403 | No | La credencial no puede operar en el ambiente de la ruta. | Las credenciales de pruebas (foecf_test_) solo usan /v1/TesteCF; las de producción, /v1/eCF. |
| `IDEMPOTENCY_IN_FLIGHT` | 409 | Sí | La petición previa con la misma Idempotency-Key sigue en curso. | Espera unos segundos y repite la misma petición. |
| `IDEMPOTENCY_KEY_CONFLICT` | 409 | No | Idempotency-Key reutilizada con un cuerpo distinto. | Para reintentar envía exactamente el mismo cuerpo; para otra operación usa otra clave. |
| `IDEMPOTENCY_KEY_REQUIRED` | 400 | No | Esta operación exige la cabecera Idempotency-Key con una credencial foecf_*. | Agrega Idempotency-Key (8 a 128 caracteres) y reintenta; ejemplo: Idempotency-Key: venta-1042-emitir. |
| `INTEGRATION_TESTS_FAILED` | 500 | Sí | No se pudieron leer los casos de prueba. | Repite en unos segundos. |
| `INTEGRATION_TESTS_TEST_KEY_ONLY` | 403 | No | Los casos de prueba solo se consultan con una credencial de pruebas. | Usa una credencial foecf_test_. |
| `INTERNAL_ERROR` | 500 | Sí | Error interno del servidor. | Repite con la misma Idempotency-Key; si persiste, informa el requestId a soporte. |
| `INVALID_CURSOR` | 400 | No | cursor no válido. | Usa el next_cursor de la respuesta anterior sin modificarlo. |
| `INVALID_ENCF` | 400 | No | e-NCF no válido. | Debe ser E + 12 dígitos. |
| `INVALID_ENVIRONMENT` | 400 | No | Ambiente no válido en la ruta. | Usa TesteCF, CerteCF o eCF. |
| `INVALID_IDEMPOTENCY_KEY` | 400 | No | Idempotency-Key debe tener 8 a 128 caracteres [A-Za-z0-9_-:.=]. | Usa una clave con ese formato. |
| `INVALID_JSON` | 400 | No | El cuerpo de la petición no es un JSON válido. | Revisa que el cuerpo sea JSON bien formado (comillas, comas y llaves) y que Content-Type sea application/json. |
| `INVALID_REFERENCIA_EXTERNA` | 400 | No | referencia_externa no es válida. | Texto de hasta 100 caracteres, sin saltos de línea. |
| `INVALID_SUCURSAL` | 400 | No | sucursal no es válida. | De 3 a 10 caracteres alfanuméricos. |
| `NC_BALANCE_INVALID` | 422 | No | La nota de crédito excede el saldo del documento que modifica. | Reduce los montos de la nota. |
| `NOT_FOUND` | 404 | No | Recurso no encontrado. | Verifica el identificador y que pertenezca a esta cuenta y a este ambiente. |
| `NOT_RECEIVED` | 409 | No | El e-CF fue acusado como No Recibido: no se puede aprobar ni rechazar. | No requiere más acciones sobre este documento. |
| `NO_CERT` | 400 | No | No hay certificado .p12 activo. | Sube el certificado desde el portal antes de emitir. |
| `PAYLOAD_TOO_LARGE` | 413 | No | El cuerpo de la petición excede el tamaño máximo permitido. | Reduce el tamaño del cuerpo. |
| `PAYMENT_REQUIRED` | 402 | No | Saldo vencido: la exportación masiva requiere regularizar el pago. | Regulariza el pago o activa el re-acceso. La emisión y la consulta individual no se bloquean. |
| `PDF_GENERATION_FAILED` | 500 | Sí | No se pudo generar la representación impresa. | Repite en unos segundos. |
| `PUBLIC_KEY_DERIVATION_FAILED` | 500 | No | No se pudo derivar la llave pública del certificado. | Vuelve a subir el certificado .p12. |
| `RATE_LIMIT` | 429 | Sí | Demasiadas solicitudes, intenta más tarde. | Espera los segundos de la cabecera Retry-After y repite la misma petición. |
| `REACCESS_REQUIRED` | 402 | No | Cuenta suspendida: la exportación masiva requiere regularizar el saldo. | Regulariza el saldo o paga el fee de re-acceso. |
| `SELF_APPROVAL_FORBIDDEN` | 403 | No | No se puede aprobar ni rechazar un e-CF emitido por la misma empresa. | Solo se aprueban documentos recibidos de otro emisor. |
| `SSRF_BLOCKED` | 400 | No | La URL apunta a una dirección no permitida. | Usa una URL pública, no una red interna. |
| `SSRF_DNS` | 400 | No | No se pudo resolver el host de la URL. | Revisa el dominio de la URL. |
| `SSRF_PROTO` | 400 | No | La URL del webhook debe ser http(s). | Usa una URL http:// o https://. |
| `STAFF_SESSION_REVOKED` | 401 | No | La sesión de soporte fue cerrada por el titular de la cuenta. | Pide al titular que vuelva a autorizar el acceso. |
| `STRICT_RATE_LIMIT` | 429 | Sí | Límite de operaciones sensibles alcanzado. | Espera Retry-After y repite. |
| `TENANT_INACTIVE` | 403 | No | Cuenta suspendida o pendiente de activación. | Contacta a soporte o completa la activación de la cuenta. |
| `TENANT_NOT_FOUND` | 404 | No | Cuenta no encontrada. | Verifica que la clave pertenezca a la cuenta correcta. |
| `TENANT_RNC_INVALID` | 422 | No | El RNC de la cuenta no es válido para el acuse. | Corrige el RNC de la cuenta en el portal. |
| `TOKEN_INVALID` | 401 | No | Token inválido o expirado. | Vuelve a autenticarte o usa una clave de API. |
| `UNAUTHORIZED` | 401 | No | Se requiere autenticación. | Envía una clave válida en X-API-Key. |
| `VALIDATION` | 400 | No | La petición no tiene el formato esperado. | Revisa el cuerpo y los parámetros contra el contrato. |
| `WEBHOOK_TEST_FAILED` | 500 | Sí | No se pudo probar el webhook. | Repite; revisa que tu servidor responda. |
| `XSD_VALIDATION_FAILED` | 422 | No | El XML no cumple el esquema oficial de la DGII. | Corrige los campos indicados en `details`. |
| `XSD_VALIDATION_POSTSIGN_FAILED` | 500 | Sí | El XML firmado no cumple el esquema. | Repite; si persiste, informa el requestId a soporte. |

Esta tabla se genera del catálogo del servicio (`src/utils/errorCatalog.js`) y una prueba falla si el servicio devuelve un código que no esté aquí. El documento OpenAPI ([Referencia](referencia.md)) trae los mismos códigos como enumeración.
