<!-- Generado desde https://ecf.frandeone.com/developers/docs/recibidos.html · no editar a mano: se regenera desde el ECF -->


# Recibidos y aprobación comercial

_Cuando un proveedor te factura con e-CF, el documento llega a tu cuenta. El ECF devuelve el acuse y tú decides la aprobación comercial._

## Qué hace el ECF solo

- Recibe el e-CF que te envía el proveedor (o la DGII en las pruebas), valida su firma y su esquema.
- Devuelve el **acuse de recibo (ARECF)** firmado: «Recibido», o «No Recibido» con el motivo (esquema inválido, firma inválida, envío duplicado o RNC de comprador que no corresponde). No tienes que hacer nada.
- Guarda el documento y te avisa con el evento `ecf.received` por [webhook](webhooks.md).

## Consultar los recibidos

| Quieres… | Ruta |
|---|---|
| Listar (con `search`, `aprobacion_estado` = `pendiente`, `aprobado` o `rechazado`, y paginación) | `GET /v1/{env}/documentos-recibidos` |
| El detalle de uno | `GET /v1/{env}/documentos-recibidos/{id}` |
| Su XML original | `GET /v1/{env}/documentos-recibidos/{id}/xml` |
| El acuse (ARECF) que se devolvió | `GET /v1/{env}/documentos-recibidos/{id}/arecf` |
| El historial de aprobaciones que enviaste | `GET /v1/{env}/aprobaciones-comerciales` |

```bash
curl "https://ecf.frandeone.com/v1/TesteCF/documentos-recibidos?aprobacion_estado=pendiente" \
  -H "X-API-Key: $ECF_API_KEY"
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/documentos-recibidos?aprobacion_estado=pendiente');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => ['X-API-Key: ' . getenv('ECF_API_KEY')],
]);
$cuerpo = json_decode(curl_exec($ch), true);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo $http, " ", json_encode($cuerpo, JSON_UNESCAPED_UNICODE), PHP_EOL;
```

```javascript
// Node 18 o superior
(async () => {
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/documentos-recibidos?aprobacion_estado=pendiente', {
    headers: { 'X-API-Key': process.env.ECF_API_KEY },
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

r = requests.get(
    "https://ecf.frandeone.com/v1/TesteCF/documentos-recibidos?aprobacion_estado=pendiente",
    headers={"X-API-Key": os.environ["ECF_API_KEY"]},
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));

var respuesta = await http.GetAsync("https://ecf.frandeone.com/v1/TesteCF/documentos-recibidos?aprobacion_estado=pendiente");
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

En el listado, `is_self_emitted` marca los documentos emitidos por tu propia empresa: no se aprueban.

## Aprobar o rechazar

La **aprobación comercial** (ACECF) le dice al emisor, a través de la DGII, si aceptas o no el documento. Hay dos formas:

POST `/v1/{env}/documentos-recibidos/{id}/approve`sin cuerpo

POST `/v1/{env}/documentos-recibidos/{id}/reject`con el motivo

```json
{
  "reason": "Los montos no corresponden a la orden de compra"
}
```

POST `/v1/{env}/aprobacion-comercial`por e-NCF y RNC del emisor

```json
{
  "encf": "E310000000001",
  "rnc_emisor": "130000001",
  "estado": "aprobado"
}
```

En esta última, `estado` es `aprobado` o `rechazado`, y con `rechazado` el `motivo` es obligatorio. Las tres rutas exigen `Idempotency-Key` con credenciales `foecf_*` ([Idempotencia](idempotencia.md)).

| Error | Qué significa |
|---|---|
| `SELF_APPROVAL_FORBIDDEN` (403) | Intentas aprobar un documento emitido por tu propia empresa. |
| `NOT_RECEIVED` (409) | El documento se acusó como «No Recibido»: no se puede aprobar ni rechazar. |
| `ALREADY_PROCESSED` (409) | Ya tiene una decisión comercial. Solo se reenvía la misma decisión si falló el envío. |
| `ACECF_DGII_ERROR` (424) | La DGII no aceptó la aprobación. Revisa `data` (estado y mensaje) y reenvía la misma decisión. |
| `DOC_NOT_FOUND` / `NOT_FOUND` (404) | El documento no existe en tu cuenta y ambiente. |

## Cuando el comprador responde a tus documentos

Si un comprador aprueba o rechaza uno de **tus** e-CF, el ECF verifica la firma del ACECF, lo cruza con tu documento y te avisa con el evento `ecf.commercial_status` (`comercialEstado` y, si lo rechazó, `comercialMotivo`). Después de aprobado por la DGII, el ECF también se lo entrega al emisor original cuando este publica su dirección de aprobación en el directorio de la DGII.
