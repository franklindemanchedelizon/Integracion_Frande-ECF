<!-- Generado desde https://ecf.frandeone.com/developers/docs/developers-y-revendedores.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Developers y revendedores

_Para quien compra un plan con una cantidad de documentos, integra el ECF en su software y lleva a sus clientes por la certificación y la integración._

> i

El portal propio de developers (`/developers`) está en construcción. Esta página dice qué existe hoy y marca lo que viene; no se ofrece nada que todavía no funcione.

## Lo que hay hoy

- **Cuenta de integrador.** Una cuenta de tipo developer se administra desde la página «Desarrollador» del portal: enlace de referido, uso del pool de documentos del plan, lista de clientes, alta de clientes y cupo de documentos por cliente.
- **Cada cliente es dueño de lo suyo.** Su cuenta, su certificado digital, sus credenciales y sus documentos son del cliente. Tu sistema se configura con la credencial que _ese cliente_ crea en su portal (ver [Ambientes y credenciales](ambientes-y-credenciales.md)).
- **Credencial de integrador `foecf_dev_`.** Existe como tipo de credencial y **no emite ni consulta documentos**: en las rutas de documentos responde 403 `ENVIRONMENT_NOT_ALLOWED_FOR_KEY`.
- **Sandbox para todos tus clientes.** Cada cliente tiene su `foecf_test_` y los [casos de prueba](casos-de-prueba.md) para comprobar su conexión antes de producción.

## Reglas que no cambian

- La facturación de un cliente **nunca se bloquea**: si tú dejas de pagar, tus clientes siguen emitiendo.
- El integrador **no custodia** el certificado digital ni la credencial de producción de sus clientes.
- Todo lo que pruebes va a `TesteCF`.

## Lo que viene Próximamente

- Portal `/developers` propio: alta de clientes con un enlace de reclamo para que el dueño confirme su cuenta, e invitación de clientes que ya existen con su consentimiento.
- Ver por cliente su certificación, ambiente, casos de prueba, uso, plan y alertas (certificado por vencer, rechazos, contingencia).
- Crear para un cliente una credencial de pruebas, asignar cupo del pool, elegir plan y pagar por tus clientes.
- Una API de gestión bajo `/v1/developer/…` con la credencial `foecf_dev_` (solo gestión, sin emisión).
- Webhooks propios de alertas de todos tus clientes.

Cuando salga cada pieza se anunciará en el [registro de cambios](referencia.md#cambios).
