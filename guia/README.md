<!-- Generado desde https://ecf.frandeone.com/developers/docs/ · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Documentación para integradores

_Todo lo que necesitas para conectar un sistema (un ERP, un punto de venta, un programa propio) a la facturación electrónica de la DGII con Frande One ECF._

> !

**Toda prueba va a TesteCF.** El ambiente `eCF` es producción: cada documento es real y tiene efecto fiscal. Tu credencial de pruebas (`foecf_test_…`) solo funciona en TesteCF.

## Lo esencial en un vistazo

| Dato | Valor |
|---|---|
| Base de la API | `https://ecf.frandeone.com/v1` |
| Ambientes | `/v1/TesteCF` (pruebas) · `/v1/eCF` (producción) · `/v1/CerteCF` (certificación) |
| Autenticación | `X-API-Key: foecf_test_…` (o `Authorization: Bearer`, `Authorization` sin Bearer, `ApiKey`) |
| Formato | JSON en español. Respuesta `{"success": true, "data": …, "requestId": …}`; error `{"success": false, "error": {"code", "message"}, "requestId": …}` |
| Reintentos seguros | Cabecera `Idempotency-Key` (obligatoria con credenciales `foecf_*` al emitir, anular y aprobar) |
| Avisos | Webhooks firmados con HMAC-SHA256, separados para pruebas y producción |
| Referencia | /api-docs · /openapi.json · /llms.txt |

## Recorrido recomendado

1. [Inicio rápido](inicio-rapido.md): tu primer e-CF de prueba con curl.
2. [Ambientes y credenciales](ambientes-y-credenciales.md) y [Emitir un e-CF](emitir.md): lo que necesita tu sistema para emitir cada tipo.
3. [Idempotencia](idempotencia.md) y [Webhooks](webhooks.md): que tu sistema aguante cortes y se entere de cada cambio.
4. [Casos de prueba del sandbox](casos-de-prueba.md): la lista que demuestra que tu sistema está listo.
5. Cuando tu cuenta esté certificada: la credencial de producción y la URL `/v1/eCF`.

Si eres el cliente que configura un sistema que ya tienes (y no vas a programar), empieza por [Conecta tu sistema](conecta-tu-sistema.md).

## Todas las secciones

[### Inicio rápidoDe cero a tu primer e-CF de prueba en TesteCF, con curl, en unos minutos.](inicio-rapido.md)

[### Conecta tu sistemaQué copiar de la sección «Credenciales de API» del portal y dónde pegarlo en el sistema de facturación que ya usas.](conecta-tu-sistema.md)

[### Ambientes y credencialesLa credencial decide el ambiente. Prefijos, cómo se crean y rotan, y el paso por la certificación de la DGII.](ambientes-y-credenciales.md)

[### Emitir un e-CFCómo armar y enviar cada tipo de e-CF, con un ejemplo validado por tipo.](emitir.md)

[### Casos de prueba del sandboxLos 12 casos con los que el ECF comprueba que tu sistema quedó bien conectado, cada uno con su JSON.](casos-de-prueba.md)

[### NumeraciónQuién asigna el e-NCF, qué valida el ECF y cómo evitar huecos y repetidos.](numeracion.md)

[### Idempotencia y reintentosCómo reintentar una petición sin duplicar un documento.](idempotencia.md)

[### Estados, consultas y archivosCómo seguir un documento hasta su estado final y descargar sus archivos.](estados-y-consultas.md)

[### Corregir y anularCómo corregir un documento ya emitido con notas, y cómo anular números que no se usaron.](corregir-y-anular.md)

[### Recibidos y aprobación comercialLos e-CF que te emiten tus proveedores: acuse automático, y cómo los apruebas o rechazas.](recibidos.md)

[### ContingenciaQué hace el ECF si la DGII o la conexión fallan, y qué debe hacer tu sistema.](contingencia.md)

[### Webhooks y verificación de firmaRecibe en tu servidor el cambio de estado de tus documentos, y comprueba que el aviso viene del ECF.](webhooks.md)

[### Catálogo de erroresTodos los códigos de error que puede devolver la API, qué significan y qué hacer.](errores.md)

[### Límites y planesLos límites de ritmo de la API, el tamaño máximo, y los planes vigentes (siempre leídos del servicio).](limites-y-planes.md)

[### Developers y revendedoresQué hay hoy para quien integra el ECF para sus propios clientes, y qué viene.](developers-y-revendedores.md)

[### Referencia y registro de cambiosLa referencia técnica completa de cada ruta, el registro de cambios, el glosario y llms.txt.](referencia.md)

> i

Lo marcado Próximamente todavía no existe. Se dice así en cada página para que no pierdas tiempo buscándolo.
