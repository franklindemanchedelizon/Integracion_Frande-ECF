<!-- Generado desde https://ecf.frandeone.com/developers/docs/conecta-tu-sistema.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Conecta tu sistema

_Para clientes que ya usan un sistema (un punto de venta, un ERP u otro programa) que pide los datos de un proveedor de facturación electrónica._

Si tu sistema te pide configurar un proveedor e-CF, no tienes que programar nada: copias unos datos de la página **Credenciales de API** del portal y los pegas en la pantalla de configuración de ese sistema. Esta página te dice qué dato va en cada campo.

## Los datos que te pedirá tu sistema

En el portal, abre _Credenciales de API_ y elige arriba **Pruebas** o **Producción**. Cada dato tiene un botón _Copiar_.

| Lo que pide el sistema | Qué poner | Dónde lo ves |
|---|---|---|
| URL del servidor o URL base del API | Pruebas: `https://ecf.frandeone.com/v1/TesteCF` Producción: `https://ecf.frandeone.com/v1/eCF` Va **sin** la ruta del endpoint (sin `/documentos-ecf`). | Bloque _URL para tu sistema_ |
| Token, clave de API, API Key | La credencial de ese ambiente: `foecf_test_…` en pruebas, `foecf_live_…` en producción. | Bloque _Sistemas conectados_ (se ve una sola vez al crearla) |
| Ambiente | Pruebas: `TesteCF` (a veces «Pruebas»). Producción: `eCF` (a veces «Producción»). | Selector de ambiente |
| RNC del emisor | El RNC de tu empresa, solo dígitos. | Bloque _Datos que te pedirá tu sistema_ |
| Código de sucursal | `001` por defecto, o la sucursal que asignaste a la credencial. | Mismo bloque |
| Nombre de la base de datos (opcional) | No aplica: déjalo vacío. | No hace falta |

## Cómo debe enviar la clave tu sistema

Cada sistema manda la clave de una manera. El ECF acepta las cuatro, así que no tienes que adivinar:

| Si tu sistema envía… | Ejemplo |
|---|---|
| `X-API-Key` (el recomendado) | `X-API-Key: foecf_test_…` |
| `Authorization: Bearer` | `Authorization: Bearer foecf_test_…` |
| `Authorization` sin la palabra Bearer | `Authorization: foecf_test_…` |
| `ApiKey` | `ApiKey: foecf_test_…` |

> i

Estas variantes solo se reconocen si el valor tiene forma de credencial del ECF (`foecf_test_`, `foecf_live_`, `foecf_dev_` o la clave original `ecf_sk_`). Un token de otra clase no se toma como clave.

## Probar la conexión

Casi todos los sistemas tienen un botón _Probar conexión_. Internamente hace `GET /v1/TesteCF/cuenta` (o `/v1/eCF/cuenta` en producción), que solo lee. Si funciona, el portal marca el caso 1 de los [casos de prueba](casos-de-prueba.md) en verde.

También puedes probarlo tú desde una terminal; es el mismo paso del [inicio rápido](inicio-rapido.md#conexion).

## Qué dato va en cada campo de tu sistema

La pantalla de facturación electrónica de tu sistema pide más o menos estos campos. La correspondencia con los datos del ECF es:

| Campo de tu sistema | Dato de esta página |
|---|---|
| URL del servidor | URL base del ambiente (sin la ruta del endpoint) |
| Ambiente (Pruebas o Producción, o `TesteCF` y `eCF`) | El que elegiste en el portal |
| Token o clave API | La credencial de ese ambiente |
| Encabezado | El que use el campo de la clave: `X-API-Key`, `Authorization: Bearer`, `Authorization` sin Bearer o `ApiKey` |
| RNC del emisor | El RNC de tu empresa |
| Código de sucursal (`001`) | La sucursal de la credencial |

> i

Los nombres de los campos cambian de un sistema a otro. Si tu sistema te pide un formato de documento que no es el del ECF, escríbenos antes de configurarlo en producción.

## Pasar de pruebas a producción

1. Prueba todo en **Pruebas** hasta que los casos obligatorios estén en verde.
2. Cuando tu cuenta esté certificada ante la DGII, crea en el portal tu credencial de **Producción** (te pide tu contraseña).
3. En tu sistema cambia dos cosas: la URL a `…/v1/eCF` y la credencial a la `foecf_live_…`. El RNC y la sucursal no cambian.
4. Pulsa _Probar conexión_ en producción: solo lee, no emite.

> ×

**Nunca pruebes en producción.** En `eCF` cada documento es real y tiene efecto fiscal. Toda prueba va en `TesteCF`.
