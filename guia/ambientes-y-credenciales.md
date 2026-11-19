<!-- Generado desde https://ecf.frandeone.com/developers/docs/ambientes-y-credenciales.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Ambientes y credenciales

_En el ECF la credencial decide el ambiente. Cada cuenta tiene sus dos juegos: pruebas y producción._

## Los ambientes

| Ambiente | URL base | Para qué sirve | Efecto fiscal |
|---|---|---|---|
| `TesteCF` | `https://ecf.frandeone.com/v1/TesteCF` | Pruebas de integración. Disponible para toda cuenta desde el primer día, certificada o no. | Ninguno |
| `CerteCF` | `https://ecf.frandeone.com/v1/CerteCF` | Certificación ante la DGII (el set de pruebas del emisor). Lo usa el asistente de certificación del portal. | Ninguno |
| `eCF` | `https://ecf.frandeone.com/v1/eCF` | Producción. Se activa cuando la cuenta queda certificada. | **Real** |

Lo que emites en TesteCF no toca la numeración, la cuota del plan ni el webhook de producción. Los documentos de pruebas y los de producción se consultan por separado.

## Las credenciales

| Prefijo | Ambiente | Qué puede hacer |
|---|---|---|
| `foecf_test_` | Pruebas | Solo opera en `/v1/TesteCF`, aunque la cuenta ya esté certificada. En `/v1/eCF` responde 403 `ENVIRONMENT_NOT_ALLOWED_FOR_KEY`. |
| `foecf_live_` | Producción | Solo opera en `/v1/eCF` y solo si la cuenta está certificada. Se crea desde el portal confirmando la contraseña. |
| `foecf_dev_` | Integrador | No emite ni consulta documentos: responde 403 `ENVIRONMENT_NOT_ALLOWED_FOR_KEY` en las rutas de documentos. Ver Developers y revendedores. |

Una credencial tiene forma `foecf_test_` + 8 caracteres hexadecimales + `_` + 48 caracteres hexadecimales. Los primeros 8 son su identificador público; el resto es el secreto. El ECF guarda solo una huella: **la clave completa se muestra una sola vez**, al crearla o rotarla.

> i

La clave original de la cuenta (`ecf_sk_…`) sigue funcionando para los sistemas que ya la usan (como el ERP de Frande). Para sistemas nuevos usa siempre las credenciales `foecf_*`: separan pruebas de producción y exigen `Idempotency-Key`.

### Crear, rotar y revocar

Todo se hace desde el portal, en _Credenciales de API_, con tu sesión. **Una credencial nunca puede crear, rotar ni revocar credenciales**: no hay endpoint para eso en la API pública.

- **Crear.** Con una etiqueta que te ayude a reconocerla («Caja principal», «Caja 2»). Puedes tener varias por ambiente (hasta 20 vivas) para que cada sistema use la suya.
- **Rotar con gracia.** Al rotar eliges cuánto tiempo sigue viva la clave vieja: **0 (muere al instante), 24 horas (por defecto) o 7 días**. Así cambias la clave en tu sistema sin cortar el servicio.
- **Revocar.** Deja la credencial inservible de inmediato.
- **Último uso.** El portal muestra la fecha y la IP del último uso de cada credencial.
- Cada vez que se crea, rota o revoca una credencial, el dueño de la cuenta recibe un aviso por correo.

> i

Restringir una credencial por IP y limitarla por alcances (solo emitir, solo consultar…) Próximamente. Hoy una credencial puede usar todas las operaciones de su ambiente.

Si tienes una credencial que filtraste por error, revócala y crea otra. Nunca la pegues en repositorios, tickets ni correos.

## Cómo se envía la clave

Con el encabezado `X-API-Key: <credencial>`. También se aceptan `Authorization: Bearer <credencial>`, `Authorization: <credencial>` (sin Bearer) y `ApiKey: <credencial>`, para los sistemas que usan esas formas. Detalle en [Conecta tu sistema](conecta-tu-sistema.md#encabezado).

## Certificación ante la DGII y paso a producción

Para emitir en producción, la cuenta debe pasar la certificación de emisor electrónico de la DGII. El portal la lleva en un asistente de 14 pasos (postulación, set de pruebas de datos y de aprobación comercial, simulación de 25 e-CF, representación impresa, pruebas de recepción, declaración jurada y verificación). El ambiente de tu cuenta avanza con la certificación: TesteCF al empezar, CerteCF durante las pruebas de la DGII y eCF al aprobarse.

Mientras tanto, tu integración se prueba en TesteCF con la credencial `foecf_test_`; no hace falta esperar a estar certificado para conectar y probar tu sistema.

1. Cumple los [casos de prueba](casos-de-prueba.md) obligatorios en TesteCF.
2. Termina la certificación en el asistente del portal.
3. Con la cuenta certificada, crea la credencial `foecf_live_` (portal, _Credenciales de API_, _Producción_, con tu contraseña). Si los casos obligatorios no están completos, el portal te avisa, pero no te lo impide.
4. Cambia en tu sistema la URL a `/v1/eCF` y la credencial. Prueba la conexión (solo lee).

## Certificado digital

El certificado `.p12` firma tus e-CF. Lo cargas en el portal (_Certificados_) y el ECF lo guarda cifrado. Lo que puedes hacer con tu credencial es solo consultar:

GET `/v1/{env}/certificates/info`datos del certificado activo, días para vencer, si está vencido

POST `/v1/{env}/certificates/test-auth`prueba que la DGII acepta tu certificado (límite de 10 por minuto)

> i

**Subir el certificado sin compartirlo: enlace de carga** Próximamente. Hoy el certificado lo sube el titular de la cuenta desde el portal. Una credencial de API no sube ni cambia el certificado, y tu proveedor o integrador nunca debe pedirte el archivo ni su contraseña.
