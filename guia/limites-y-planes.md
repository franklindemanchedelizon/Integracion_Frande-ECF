<!-- Generado desde https://ecf.frandeone.com/developers/docs/limites-y-planes.html · no editar a mano: se regenera desde el ECF -->


# Límites y planes

_Dos clases de límites: de ritmo (por minuto) y del plan (documentos al mes). Pasarte del plan nunca frena tu facturación._

## Límites de ritmo

| Operación | Límite por minuto | Se cuenta por |
|---|---|---|
| Peticiones en general (consultas, listas, archivos) | 120 | Credencial (o IP si no envías ninguna) |
| Emitir (`POST /{env}/documentos-ecf`) | 30 | Cuenta |
| Operaciones sensibles (probar la autenticación con la DGII, entre otras) | 10 | Cuenta |

- Al pasarte recibes **429** (`RATE_LIMIT`, `EMIT_RATE_LIMIT` o `STRICT_RATE_LIMIT`) con el encabezado `Retry-After` en segundos. Espera ese tiempo y repite la misma petición con la misma `Idempotency-Key`.
- Para mandar muchos documentos, distribúyelos en el tiempo (30 por minuto) en vez de ráfagas, y usa una cola de tu lado.
- Tamaño máximo del cuerpo: **5 MB** al emitir y **256 KB** en el resto. Si te pasas, 413 `PAYLOAD_TOO_LARGE`.
- Lista de documentos: hasta 200 por página; `batch-status`: hasta 50 por llamada.

> ℹ️ Los límites por credencial y por plan, y un límite del sandbox por IP, están en el plan de trabajo Próximamente. Hoy los de arriba son los vigentes.

## La cuota del plan nunca bloquea

- Cada plan incluye una cantidad de documentos al mes. Solo cuentan los de **producción (eCF)**: los de TesteCF y CerteCF no suman a tu cuota y el ambiente de pruebas no tiene límite de plan.
- **Si te pasas, el ECF sigue emitiendo.** El exceso se registra, se avisa y se cobra después según tu plan. La facturación electrónica no se detiene por la cuota.
- Lo que sí detiene una emisión son errores del documento, un certificado ausente o vencido, el correo sin verificar o la cuenta inactiva. Un saldo vencido bloquea la exportación masiva ([el listado](estados-y-consultas.md#listar)), nunca la emisión ni la consulta individual.
- Tu consumo del mes aparece en `GET /v1/{env}/cuenta` (campo `plan`) y en el portal.

## Los planes vigentes

Los planes y sus precios **cambian**, así que esta documentación no los copia: se leen en este momento del servicio.

Cargando los planes…

Activa JavaScript para ver la tabla, o consulta `GET /api/public/plans`.

GET `/api/public/plans`sin autenticación

```bash
curl "https://ecf.frandeone.com/api/public/plans"
```

```php
<?php
$planes = json_decode(file_get_contents('https://ecf.frandeone.com/api/public/plans'), true);
foreach ($planes['data'] as $plan) {
    echo $plan['name'], ' ', $plan['max_docs_month'], PHP_EOL;
}
```

```javascript
(async () => {
  const r = await fetch('https://ecf.frandeone.com/api/public/plans');
  const { data } = await r.json();
  data.forEach((plan) => console.log(plan.name, plan.max_docs_month));
})();
```

```python
import requests

planes = requests.get("https://ecf.frandeone.com/api/public/plans", timeout=30).json()["data"]
for plan in planes:
    print(plan["name"], plan["max_docs_month"])
```

```csharp
using var http = new HttpClient();
var json = await http.GetStringAsync("https://ecf.frandeone.com/api/public/plans");
Console.WriteLine(json);
```

Cada plan trae, entre otros, `code`, `name`, `max_docs_month`, `price_dop` y `price_usd`.
