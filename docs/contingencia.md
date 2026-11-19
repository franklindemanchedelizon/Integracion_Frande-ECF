# Contingencia de facturación electrónica

Basado en el *Instructivo de Contingencia de Facturación Electrónica* de la DGII (Gerencia de Facturación, octubre 2026; publicación informativa sin validez legal) y en el Decreto 587-24, arts. 39 a 43. Ante cualquier duda manda la norma oficial: https://dgii.gov.do

## Los tres casos

### 1. Falla la DGII

Si los sistemas de la DGII no están disponibles, el emisor **guarda los e-CF y los envía cuando vuelve la comunicación**. Los mantenimientos programados se publican antes en el portal de la DGII (*Mantenimientos de Facturación Electrónica*) y en el servicio web *Consulta Estatus Servicios*.

**Con Frande ECF:** automático. Tu e-CF ya sale firmado, con su código de seguridad y su QR, y Frande ECF lo reintenta hasta que la DGII lo recibe. No tienes que hacer nada.

### 2. Falta de conectividad del emisor

Si tu empresa no puede transmitir por falta de conexión o por intermitencia:

- Los e-CF se generan *offline* y se envían a la DGII en un plazo **no mayor de 72 horas** después de restablecida la conexión.
- La representación impresa lleva la leyenda: *«e-CF emitido en modalidad de Contingencia, el cual podrá ser consultado para su validez fiscal, a partir de las setenta y dos (72) horas.»*

**Con Frande ECF:** la firma la hace el servicio, así que sin conexión con él tu sistema no obtiene la firma. Ante un corte corto, reintenta con la misma `Idempotency-Key`. Si el corte se alarga, pasa al caso 3.

### 3. Imposibilidad de emitir e-CF

Cuando la empresa no tiene capacidad técnica de emitir e-CF:

1. **Declara la entrada** en la Oficina Virtual (OFV): *Facturación Electrónica → Contingencia FE → Declaración Entrada en Contingencia*. Elige la modalidad **Total** (toda la empresa) o **Parcial** (una o varias sucursales o unidades), escribe la razón y guarda. La OFV confirma: *«Ahora se encuentra en estado de Contingencia»*.
2. **Emite comprobantes no electrónicos autorizados (serie B)**. Solo los emitidos en una contingencia **notificada** sirven al comprador para sustentar costos, gastos y crédito fiscal.
3. **No más de 15 días calendario.**
4. **Declara la salida** en la misma pantalla (*Declaración Salida de Contingencia*). Todo queda en el *Histórico de Contingencias* y en la bandeja de notificaciones de la OFV.
5. En un máximo de **30 días calendario** desde la salida, envía los **e-CF que reemplazan** a cada comprobante B entregado: código de modificación **4** («Reemplazo NCF emitido en contingencia»), **solo a la DGII**, no al comprador.

Quien declara la contingencia es el contribuyente (o su delegado o contador con acceso a la OFV). Un sistema de facturación no puede hacerlo por él.

## Contacto DGII

Centro de Contacto (809) 689-3444, opción 4 · informacion@dgii.gov.do · Comunidad de Ayuda del portal, categoría «Facturación Electrónica».
