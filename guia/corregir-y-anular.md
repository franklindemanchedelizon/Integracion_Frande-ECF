<!-- Generado desde https://ecf.frandeone.com/developers/docs/corregir-y-anular.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Corregir y anular

_Un e-CF emitido no se borra. Se corrige con una nota de crédito o de débito; los números que nunca se usaron se anulan ante la DGII con ANECF._

## Notas de crédito (E34) y de débito (E33)

Se emiten con el mismo endpoint que cualquier e-CF ([Emitir un e-CF](emitir.md)) y llevan el bloque `InformacionReferencia` con el documento que modifican:

| Campo | Qué lleva |
|---|---|
| `NCFModificado` | El e-NCF original (`E` + 12 dígitos) o un NCF tradicional (`B` + 10 dígitos). |
| `FechaNCFModificado` | Fecha del documento original, `DD-MM-AAAA`. |
| `CodigoModificacion` | `1` anula el NCF modificado · `2` corrige texto · `3` corrige montos · `4` reemplaza un NCF emitido en contingencia · `5` referencia una factura de consumo electrónica. |
| `IndicadorNotaCredito` (solo E34, en `IdDoc`) | `0` si la nota se emite dentro de los 30 días del documento original y `1` si es después. Otro valor se rechaza. |

### El saldo se verifica

Si el `NCFModificado` es un e-CF, debe existir en tu cuenta, no estar rechazado, y el monto de la nota no puede superar su saldo disponible (el total original menos las notas ya aceptadas), ni el de cada rubro gravado o exento. Con `CodigoModificacion` `1` el monto debe ser exactamente el del documento. Si no se cumple recibes 422 `NC_BALANCE_INVALID` y no se gasta número. Los NCF tradicionales (`B…`) no se verifican.

Para ver el JSON completo de cada nota, ve a [E34](emitir.md#e34) y [E33](emitir.md#e33).

> i

Corregir un documento _rechazado_ por la DGII no requiere nota: se corrige y se emite de nuevo. Si la DGII liberó el número, se puede reutilizar (ver [Numeración](numeracion.md#reutilizar)).

## Anular números sin usar (ANECF)

La anulación de secuencias (ANECF) le dice a la DGII que unos números de tu rango **no se van a usar**: saltos por un error, o un rango que ya no necesitas. **No anula un documento que ya emitiste y la DGII aceptó;** para eso usa una nota de crédito.

POST `/v1/{env}/anulacion-ecf`exige Idempotency-Key con credenciales foecf_*

```json
{
  "anulaciones": [
    {
      "tipo_ecf": "32",
      "secuencias": [
        {
          "desde": "E320000000100",
          "hasta": "E320000000110"
        }
      ]
    }
  ]
}
```

También se acepta la forma corta `{"rangos": [{"desde": "E310000000100", "hasta": "E310000000110"}]}`, donde el tipo se deduce del número.

- Hasta **10 grupos** (tipos de comprobante) por solicitud y 10,000 rangos por grupo; si te pasas, 400 `ANECF_TOO_MANY_GROUPS` o `ANECF_TOO_MANY_SEQUENCES`: divide la solicitud.
- Un rango debe ser de un solo tipo: 422 `ANECF_TIPO_MISMATCH` o `ANECF_TIPO_CRUZADO` si no. `desde` no puede ser mayor que `hasta` (422 `ANECF_SECUENCIA_INVALIDA`).
- El ECF firma el XML de anulación y lo envía a la DGII. La respuesta trae `id`, `totalAnulados`, `trackId` y `estado`.
- Cuando la DGII da su veredicto, sale el evento `anecf.completed` por [webhook](webhooks.md).

```bash
curl "https://ecf.frandeone.com/v1/TesteCF/anulaciones" \
  -H "X-API-Key: $ECF_API_KEY"
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/anulaciones');
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
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/anulaciones', {
    headers: { 'X-API-Key': process.env.ECF_API_KEY },
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

r = requests.get(
    "https://ecf.frandeone.com/v1/TesteCF/anulaciones",
    headers={"X-API-Key": os.environ["ECF_API_KEY"]},
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));

var respuesta = await http.GetAsync("https://ecf.frandeone.com/v1/TesteCF/anulaciones");
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

`GET /v1/{env}/anulaciones` lista tus anulaciones del ambiente y `GET /v1/{env}/anulaciones/{id}` trae el detalle. Es el caso 12 de los [casos de prueba](casos-de-prueba.md).
