<!-- Generado desde https://ecf.frandeone.com/developers/docs/contingencia.html · no editar a mano: se regenera desde el ECF -->


# Contingencia

_La facturación electrónica no se bloquea. Esta página separa lo que el ECF hace solo de lo que le toca al contribuyente según las reglas de la DGII._

Fuente de las reglas: Ley 32-23, Decreto 587-24 (art. 40) y el Instructivo de Contingencia de la DGII. Las normas pueden cambiar: confirma con la DGII o con tu contador.

## Lo que hace el ECF solo: la DGII no responde

- Tu documento se **firma y se guarda** igual, y la emisión responde 201. Queda en `en_cola`.
- El ECF reintenta el envío a la DGII a los 5, 10, 20, 40 y 80 minutos (con tope de 6 horas y una variación de más o menos 10 %), hasta 10 intentos.
- Cuando la DGII vuelve, el documento avanza solo y recibes el aviso por [webhook](webhooks.md).
- Los documentos que no se pueden enviar no se pierden: siguen consultables y se ven en el portal.

> ℹ️ Nunca dependas de que el ECF "decida" tu contingencia: lo que sigue es la regla de la DGII y lo declara el contribuyente.

## Falta de conectividad: 72 horas

Si tu sistema no puede emitir o enviar por falta de conexión o intermitencia, la regla de la DGII es generar los e-CF y remitirlos a la DGII cuando se restablezca la conexión, **en un plazo no mayor de 72 horas**. Mientras tanto, la representación impresa que entregas al cliente debe llevar la leyenda de contingencia que indica la DGII (el e-CF podrá consultarse como válido pasadas las 72 horas).

Con el ECF: si tu sistema pierde la conexión con el ECF, guarda la venta con su número y **envíala al ECF al volver**, con la misma `Idempotency-Key`. El ECF firma y envía a la DGII. Nunca firmes fuera del ECF: el certificado no sale de él.

## Imposibilidad técnica de emitir: serie B

Si no puedes emitir e-CF por una falla técnica, la DGII permite emitir comprobantes **no electrónicos (serie B)** por un máximo de **15 días calendario**. El contribuyente debe **declarar la entrada y la salida de la contingencia** en la Oficina Virtual de la DGII (menú Facturación Electrónica, Contingencia FE); el ECF no hace esa declaración por ti.

## Reemplazar la serie B por e-CF: CodigoModificacion 4

Al salir de la contingencia tienes **30 días calendario** para enviar a la DGII los e-CF que reemplacen los comprobantes de la serie B. Cada reemplazo es un e-CF normal con el bloque `InformacionReferencia` apuntando al comprobante B emitido, con `CodigoModificacion` `4` (reemplazo de un NCF emitido en contingencia):

```json
{
  "InformacionReferencia": {
    "NCFModificado": "B0100000123",
    "FechaNCFModificado": "05-10-2026",
    "CodigoModificacion": 4
  }
}
```

El ECF acepta un NCF tradicional (`B` + 10 dígitos) en `NCFModificado` y no verifica su saldo. Según la DGII, estos e-CF de reemplazo se envían solo a la DGII, no al comprador, que sustenta su costo con el comprobante ordinario que recibió.

## Avisos de plazos y eventos Próximamente

- Avisos automáticos al llegar a las 48 y 66 horas de un documento pendiente, y a los días de la serie B y del plazo de reemplazo.
- Los eventos de webhook `contingency.started` y `contingency.ended`, y `quota.threshold`: están en el catálogo pero todavía no se envían.

Hasta que existan, lleva tú el conteo de esos plazos.
