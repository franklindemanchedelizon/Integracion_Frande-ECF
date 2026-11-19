<!-- Generado desde https://ecf.frandeone.com/developers/docs/estados-y-consultas.html · no editar a mano: se regenera desde el ECF -->


# Estados, consultas y archivos

_Después de emitir, el documento viaja a la DGII. Aquí cómo saber en qué va y cómo bajar su XML y su PDF._

## Estados del documento

El campo `estado_dgii` pasa por estos valores:

| Estado | Significado |
|---|---|
| `en_cola` | Firmado y guardado; aún no se envía a la DGII, o el envío falló y hay un reintento programado. |
| `recibido` | La DGII devolvió un identificador (`track_id`) sin estado final. |
| `procesando` | La DGII lo recibió y lo está validando. |
| `aceptado` | Aprobado por la DGII. Incluye el «aceptado condicional» (`dgii_code` 4), cuyo mensaje queda en `dgii_message`. |
| `rechazado` | La DGII lo rechazó; el motivo está en `dgii_code` y `dgii_message`. |
| `error` | Se agotaron los reintentos de envío sin respuesta de la DGII. |

> ℹ️ Si la DGII no responde, **la emisión sigue**: el documento queda firmado en `en_cola` y el ECF reintenta el envío a los 5, 10, 20, 40 y 80 minutos (con tope de 6 horas y hasta 10 intentos). Ver [Contingencia](contingencia.md).

## Consultar un documento

| Quieres… | Ruta |
|---|---|
| Un documento por su identificador | `GET /v1/{env}/documentos-ecf/{internalTrackId}` |
| Su estado en vivo ante la DGII (lo actualiza) | `GET /v1/{env}/documentos-ecf/{internalTrackId}/status` |
| Buscarlo por su e-NCF | `GET /v1/{env}/documentos-ecf/por-encf/{encf}` |
| Buscarlo por tu `referencia_externa` | `GET /v1/{env}/documentos-ecf/por-referencia/{ref}` |
| Varios a la vez (hasta 50) | `POST /v1/{env}/documentos-ecf/batch-status` con `{"internalTrackIds": ["…"]}` |

```bash
curl "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/por-encf/E320000000001" \
  -H "X-API-Key: $ECF_API_KEY"
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/por-encf/E320000000001');
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
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/por-encf/E320000000001', {
    headers: { 'X-API-Key': process.env.ECF_API_KEY },
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

r = requests.get(
    "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/por-encf/E320000000001",
    headers={"X-API-Key": os.environ["ECF_API_KEY"]},
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));

var respuesta = await http.GetAsync("https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/por-encf/E320000000001");
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

Un documento que no existe en tu cuenta y ambiente responde 404 `NOT_FOUND`. Si todavía no tiene `track_id`, `/status` devuelve el documento con el mensaje «Sin trackId DGII (aún en cola)». Si la DGII no contesta, 502 `DGII_QUERY_FAILED`: reintenta más tarde.

## Listar documentos

GET `/v1/{env}/documentos-ecf`

| Parámetro | Qué hace |
|---|---|
| `tipo_ecf` | Filtra por tipo: 31, 32, 33, 34, 41, 43, 44, 45, 46 o 47. |
| `estado_dgii` | Filtra por estado. Pedir `rechazado` incluye también `error`. |
| `sucursal` | Filtra por sucursal (3 a 10 caracteres alfanuméricos). |
| `search` | Texto dentro del e-NCF o del RNC del comprador. |
| `page`, `pageSize` | Paginación por páginas (tamaño por omisión 50, máximo 200). |
| `cursor` | Paginación por cursor: envía `cursor=` vacío para la primera página y luego el `pagination.next_cursor` de la respuesta, sin modificarlo. |

Con `cursor` el orden es del más reciente al más antiguo y no se corre aunque entren documentos nuevos entre una página y otra; es lo que conviene para sincronizar. Un cursor alterado responde 400 `INVALID_CURSOR`.

```json
{
  "success": true,
  "data": [
    {
      "internal_track_id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "encf": "E320000000001",
      "tipo_ecf": "32",
      "estado_dgii": "aceptado",
      "monto_total": "1180.00"
    }
  ],
  "pagination": {
    "limit": 50,
    "has_more": true,
    "next_cursor": "eyJpZCI6MTIzfQ"
  },
  "requestId": "8b1f0a6e-0c58-4b54-9b57-2f6d4d0a0e15"
}
```

> !

Si la cuenta tiene saldo vencido, el **listado masivo** puede responder 402 (`PAYMENT_REQUIRED` o `REACCESS_REQUIRED`). La lectura de un documento por su identificador, su XML y su PDF **nunca se bloquean**, y la emisión tampoco.

El listado de TesteCF o CerteCF muestra juntos los documentos de pruebas; el de eCF muestra solo los de producción.

## Descargar archivos

| Archivo | Ruta |
|---|---|
| XML firmado (`application/xml`): es el documento con validez legal, guárdalo | `GET /v1/{env}/documentos-ecf/{internalTrackId}/xml` |
| Representación impresa en PDF (con `?styled=false`, la versión mínima con el formato de la DGII) | `GET /v1/{env}/documentos-ecf/{internalTrackId}/pdf` |
| Resumen firmado (RFCE), solo en E32 menores de RD$ 250,000 | `GET /v1/{env}/documentos-ecf/{internalTrackId}/rfce` |

```bash
curl -o E320000000001.xml "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/$ID/xml" -H "X-API-Key: $ECF_API_KEY"
```

Para no consultar en bucle, recibe el cambio de estado por [webhook](webhooks.md) y consulta solo cuando llegue el aviso.
