<!-- Generado desde https://ecf.frandeone.com/developers/docs/numeracion.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Numeración

_El e-NCF identifica cada comprobante. Hoy lo asigna tu sistema; el ECF lo valida y lo guarda._

## Cómo funciona hoy: tu sistema numera

- El e-NCF tiene 13 caracteres: la letra `E`, 2 dígitos de tipo y 10 de secuencia (`E310000000001`). Va en `IdDoc.eNCF` y debe coincidir con `TipoeCF`.
- Los **rangos de numeración** los autoriza la DGII al contribuyente por tipo de comprobante (se solicitan en su Oficina Virtual). Cada rango trae una fecha de vencimiento, que va en `FechaVencimientoSecuencia` en los tipos que la llevan.
- Tu sistema debe llevar **un contador por tipo y por ambiente**, y reservar cada número en una transacción antes de enviar, para que dos cajas no tomen el mismo.
- El ECF lleva por separado los números de TesteCF y los de eCF: lo que emites en pruebas no consume tu numeración de producción.

## Qué comprueba el ECF

| Situación | Qué responde el ECF |
|---|---|
| El número ya existe en tu cuenta y ambiente, con el **mismo contenido** | 200 con el documento existente (y su estado). No se firma ni se envía otra vez. Es el reintento seguro. |
| El número ya existe con **contenido distinto** | 409 `ENCF_ALREADY_ISSUED`. |
| El número fue rechazado por la DGII y esta no lo liberó | 409 `ENCF_CONSUMED`: usa otro número. |
| Dos envíos simultáneos del mismo número | Uno gana; el otro recibe 409 `ENCF_ALREADY_ISSUED` sin firmar de nuevo. |
| Formato inválido o tipo que no coincide | 400 `ECF_VALIDATION_FAILED`. |

### Cuándo se puede reutilizar un número

Lo decide la respuesta de la DGII. Si rechazó el documento y marcó la secuencia como **no utilizada**, o si nunca llegó a la DGII, el número se puede volver a usar y el intento anterior pasa al historial de fallos. Si la DGII no se pronunció o la marcó como utilizada, **no se reutiliza**. Nunca reutilices un número por tu cuenta sin que el ECF lo acepte.

## Saltos y números sin usar

Si tu sistema salta números (un error, una caída) o te quedas con un rango que no vas a usar, los anulas ante la DGII con [ANECF](corregir-y-anular.md#anecf). Un documento que ya emitiste y la DGII aceptó no se anula con ANECF: se corrige con una nota de crédito.

## Numeración asignada por el ECF Próximamente

Está en el plan que el ECF numere por ti: reservar un número con una referencia tuya (reintento seguro), saltar los usados y quemados, consultar el estado de tus rangos y declarar números quemados. **Todavía no existe:** hoy las rutas `/numeracion/…` no están disponibles y emitir sin `eNCF` responde 400 `ECF_VALIDATION_FAILED`. Cuando salga se anunciará en el [registro de cambios](referencia.md#cambios).
