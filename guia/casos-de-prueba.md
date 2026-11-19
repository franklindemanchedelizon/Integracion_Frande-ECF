<!-- Generado desde https://ecf.frandeone.com/developers/docs/casos-de-prueba.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Casos de prueba del sandbox

_Doce comprobaciones para saber que tu sistema quedó bien conectado antes de pasar a producción._

No son el set de certificación de la DGII (ese lo hace el contribuyente una vez, en CerteCF). Estos casos se repiten cada vez que conectas otro sistema. El ECF los **detecta solo** a partir de lo que llega con tu credencial de pruebas (`foecf_test_`) y marca cada uno; no tienes que avisarle nada.

> i

La detección nunca bloquea ni retrasa nada: se registra cuando la respuesta ya salió. Un fallo se anota con su código de error, pero no borra un caso que ya estaba completo.

## Los doce casos

| N.º | Caso | Obligatorio | Cómo lo detecta el ECF |
|---|---|---|---|
| 1 | Probar conexión | Sí | GET /v1/TesteCF/cuenta con tu credencial de pruebas responde 200. |
| 2 | Validar un documento sin emitirlo | Sí | POST /v1/TesteCF/documentos-ecf?validate=true responde 200 (valid: true). |
| 3 | Factura de consumo (E32) menor de RD$ 250,000 | Sí | POST /v1/TesteCF/documentos-ecf con un E32 de MontoTotal menor de 250,000 es aceptado (en cola o enviado). |
| 4 | Factura de consumo (E32) de RD$ 250,000 o más | Sí | POST /v1/TesteCF/documentos-ecf con un E32 de MontoTotal de 250,000 o más es aceptado. |
| 5 | Factura de crédito fiscal (E31) | Sí | POST /v1/TesteCF/documentos-ecf con un E31 es aceptado. |
| 6 | Nota de crédito (E34) sobre un documento anterior | Sí | POST /v1/TesteCF/documentos-ecf con un E34 que trae InformacionReferencia es aceptado (el ECF ya comprobó que el documento referenciado existe en tu cuenta). |
| 7 | Nota de débito (E33) | Opcional | POST /v1/TesteCF/documentos-ecf con un E33 es aceptado. |
| 8 | Tipos especiales (41, 43, 44, 45, 46, 47) | Opcional | POST /v1/TesteCF/documentos-ecf con cualquiera de esos tipos es aceptado. |
| 9 | Reintento con la misma Idempotency-Key | Sí | Una emisión repetida con la misma Idempotency-Key y el mismo cuerpo vuelve con la marca «Idempotent-Replayed: true» y sin crear otro documento. |
| 10 | Consultar estado y descargar XML y PDF | Sí | Para un mismo documento: GET .../documentos-ecf/{id}/status (o .../{id}), GET .../{id}/xml y GET .../{id}/pdf responden 200. |
| 11 | Recibir el webhook y verificar la firma | Opcional | Se marca cuando hay una entrega con respuesta 2xx de un documento de pruebas, posterior a la creación de esta credencial. Es aproximado: el ECF no puede comprobar que tu sistema verificó la firma. |
| 12 | Anular números no usados (ANECF) | Opcional | POST /v1/TesteCF/anulacion-ecf responde 2xx. |

Al completar los **obligatorios (1 a 6, 9 y 10)**, el portal muestra «Tu sistema está listo para producción». Es un aviso: no bloquea la creación de la credencial de producción.

## Consultar el progreso por API

GET `/v1/TesteCF/pruebas-integracion`solo con una credencial de pruebas

Devuelve cada caso con su `estado` (`pendiente`, `ok` o `fallo`), el detalle del error explicado, los errores comunes del caso y `listo_para_produccion`. Con una credencial de producción responde 403 `INTEGRATION_TESTS_TEST_KEY_ONLY`.

```bash
curl "https://ecf.frandeone.com/v1/TesteCF/pruebas-integracion" \
  -H "X-API-Key: $ECF_API_KEY"
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/pruebas-integracion');
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
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/pruebas-integracion', {
    headers: { 'X-API-Key': process.env.ECF_API_KEY },
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

r = requests.get(
    "https://ecf.frandeone.com/v1/TesteCF/pruebas-integracion",
    headers={"X-API-Key": os.environ["ECF_API_KEY"]},
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));

var respuesta = await http.GetAsync("https://ecf.frandeone.com/v1/TesteCF/pruebas-integracion");
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

## Cada caso, con su JSON

Los documentos de abajo son los de la [página de emisión](emitir.md); usa el que corresponda y cambia el `eNCF` por un número que no hayas usado.

### Caso 1 · Probar conexión

`GET /v1/TesteCF/cuenta` con tu credencial de pruebas. Ver el [inicio rápido](inicio-rapido.md#conexion). Error típico: `ENVIRONMENT_NOT_ALLOWED_FOR_KEY` si tu sistema apunta a `/v1/eCF`.

### Caso 2 · Validar un documento

`POST /v1/TesteCF/documentos-ecf?validate=true` con cualquier documento válido, por ejemplo el E32:

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "32",
        "eNCF": "E320000000001",
        "IndicadorMontoGravado": 0,
        "TipoIngresos": "01",
        "TipoPago": 1
      },
      "Emisor": {
        "RNCEmisor": "131234567",
        "RazonSocialEmisor": "MI EMPRESA SRL",
        "DireccionEmisor": "Calle Principal 1, San Pedro de Macorís",
        "FechaEmision": "08-10-2026"
      },
      "Comprador": {
        "RazonSocialComprador": "CONSUMIDOR FINAL"
      },
      "Totales": {
        "MontoGravadoTotal": "1000.00",
        "MontoGravadoI1": "1000.00",
        "ITBIS1": 18,
        "TotalITBIS": "180.00",
        "TotalITBIS1": "180.00",
        "MontoTotal": "1180.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "1",
          "NombreItem": "Producto de mostrador",
          "IndicadorBienoServicio": "2",
          "CantidadItem": "1.00",
          "UnidadMedida": "43",
          "PrecioUnitarioItem": "1000.00",
          "MontoItem": "1000.00"
        }
      ]
    }
  }
}
```

### Caso 3 · E32 menor de RD$ 250,000

Emisión real en TesteCF del E32 de arriba (con `Idempotency-Key`). Detección: `MontoTotal` menor de 250,000.

### Caso 4 · E32 de RD$ 250,000 o más

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "32",
        "eNCF": "E320000000002",
        "IndicadorMontoGravado": 0,
        "TipoIngresos": "01",
        "TipoPago": 1
      },
      "Emisor": {
        "RNCEmisor": "131234567",
        "RazonSocialEmisor": "MI EMPRESA SRL",
        "DireccionEmisor": "Calle Principal 1, San Pedro de Macorís",
        "FechaEmision": "08-10-2026"
      },
      "Comprador": {
        "RNCComprador": "101000000",
        "RazonSocialComprador": "CLIENTE DE PRUEBA SRL"
      },
      "Totales": {
        "MontoGravadoTotal": "250000.00",
        "MontoGravadoI1": "250000.00",
        "ITBIS1": 18,
        "TotalITBIS": "45000.00",
        "TotalITBIS1": "45000.00",
        "MontoTotal": "295000.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "1",
          "NombreItem": "Servicio de instalación",
          "IndicadorBienoServicio": "2",
          "CantidadItem": "1.00",
          "UnidadMedida": "43",
          "PrecioUnitarioItem": "250000.00",
          "MontoItem": "250000.00"
        }
      ]
    }
  }
}
```

### Caso 5 · E31 crédito fiscal

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "31",
        "eNCF": "E310000000001",
        "FechaVencimientoSecuencia": "31-12-2027",
        "IndicadorMontoGravado": 0,
        "TipoIngresos": "01",
        "TipoPago": 1
      },
      "Emisor": {
        "RNCEmisor": "131234567",
        "RazonSocialEmisor": "MI EMPRESA SRL",
        "DireccionEmisor": "Calle Principal 1, San Pedro de Macorís",
        "FechaEmision": "08-10-2026"
      },
      "Comprador": {
        "RNCComprador": "101000000",
        "RazonSocialComprador": "CLIENTE DE PRUEBA SRL"
      },
      "Totales": {
        "MontoGravadoTotal": "1000.00",
        "MontoGravadoI1": "1000.00",
        "ITBIS1": 18,
        "TotalITBIS": "180.00",
        "TotalITBIS1": "180.00",
        "MontoTotal": "1180.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "1",
          "NombreItem": "Servicio de prueba",
          "IndicadorBienoServicio": "2",
          "CantidadItem": "1.00",
          "UnidadMedida": "43",
          "PrecioUnitarioItem": "1000.00",
          "MontoItem": "1000.00"
        }
      ]
    }
  }
}
```

### Caso 6 · E34 nota de crédito sobre un documento anterior

El `NCFModificado` debe existir en tu cuenta: emite primero el E31 del caso 5 y usa su número en `InformacionReferencia`.

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "34",
        "eNCF": "E340000000001",
        "IndicadorNotaCredito": 0,
        "IndicadorMontoGravado": 0,
        "TipoPago": 1
      },
      "Emisor": {
        "RNCEmisor": "131234567",
        "RazonSocialEmisor": "MI EMPRESA SRL",
        "DireccionEmisor": "Calle Principal 1, San Pedro de Macorís",
        "FechaEmision": "08-10-2026"
      },
      "Comprador": {
        "RNCComprador": "101000000",
        "RazonSocialComprador": "CLIENTE DE PRUEBA SRL"
      },
      "Totales": {
        "MontoGravadoTotal": "100.00",
        "MontoGravadoI1": "100.00",
        "ITBIS1": 18,
        "TotalITBIS": "18.00",
        "TotalITBIS1": "18.00",
        "MontoTotal": "118.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "1",
          "NombreItem": "Descuento acordado",
          "IndicadorBienoServicio": "2",
          "CantidadItem": "1.00",
          "UnidadMedida": "43",
          "PrecioUnitarioItem": "100.00",
          "MontoItem": "100.00"
        }
      ]
    },
    "InformacionReferencia": {
      "NCFModificado": "E310000000001",
      "FechaNCFModificado": "08-10-2026",
      "CodigoModificacion": 3
    }
  }
}
```

### Caso 7 · E33 nota de débito (opcional)

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "33",
        "eNCF": "E330000000001",
        "FechaVencimientoSecuencia": "31-12-2027",
        "IndicadorMontoGravado": 0,
        "TipoPago": 1
      },
      "Emisor": {
        "RNCEmisor": "131234567",
        "RazonSocialEmisor": "MI EMPRESA SRL",
        "DireccionEmisor": "Calle Principal 1, San Pedro de Macorís",
        "FechaEmision": "08-10-2026"
      },
      "Comprador": {
        "RNCComprador": "101000000",
        "RazonSocialComprador": "CLIENTE DE PRUEBA SRL"
      },
      "Totales": {
        "MontoGravadoTotal": "100.00",
        "MontoGravadoI1": "100.00",
        "ITBIS1": 18,
        "TotalITBIS": "18.00",
        "TotalITBIS1": "18.00",
        "MontoTotal": "118.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "1",
          "NombreItem": "Cargo adicional",
          "IndicadorBienoServicio": "2",
          "CantidadItem": "1.00",
          "UnidadMedida": "43",
          "PrecioUnitarioItem": "100.00",
          "MontoItem": "100.00"
        }
      ]
    },
    "InformacionReferencia": {
      "NCFModificado": "E310000000001",
      "FechaNCFModificado": "08-10-2026",
      "CodigoModificacion": 3
    }
  }
}
```

### Caso 8 · Tipos especiales (opcional)

Prueba el que use tu sistema; con uno basta (41, 43, 44, 45, 46 o 47). Ejemplos en [Emitir un e-CF](emitir.md#tipos). Por ejemplo, el E43:

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "43",
        "eNCF": "E430000000001",
        "FechaVencimientoSecuencia": "31-12-2027"
      },
      "Emisor": {
        "RNCEmisor": "131234567",
        "RazonSocialEmisor": "MI EMPRESA SRL",
        "DireccionEmisor": "Calle Principal 1, San Pedro de Macorís",
        "FechaEmision": "08-10-2026"
      },
      "Totales": {
        "MontoExento": "500.00",
        "MontoTotal": "500.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "4",
          "NombreItem": "Gasto menor",
          "IndicadorBienoServicio": "2",
          "CantidadItem": "1.00",
          "UnidadMedida": "43",
          "PrecioUnitarioItem": "500.00",
          "MontoItem": "500.00"
        }
      ]
    }
  }
}
```

### Caso 9 · Reintento con la misma Idempotency-Key

Envía el **mismo cuerpo dos veces con la misma clave**. La segunda respuesta debe llegar con el encabezado `Idempotent-Replayed: true` y sin crear otro documento:

```bash
for i in 1 2; do
  curl -i -X POST "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf" \
    -H "X-API-Key: $ECF_API_KEY" -H "Content-Type: application/json" \
    -H "Idempotency-Key: pedido-0001" --data @e32.json | grep -i -E "^HTTP|idempotent-replayed"
done
```

Más en [Idempotencia y reintentos](idempotencia.md).

### Caso 10 · Consultar estado y descargar XML y PDF

Para **un mismo documento**, los tres pasos deben responder 200:

```bash
ID="<internalTrackId>"
curl "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/$ID/status" -H "X-API-Key: $ECF_API_KEY"
curl "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/$ID/xml" -H "X-API-Key: $ECF_API_KEY"
curl "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/$ID/pdf" -H "X-API-Key: $ECF_API_KEY"
```

Si solo haces dos de los tres, el caso queda «pendiente» con el detalle de lo que falta.

### Caso 11 · Recibir el webhook y verificar la firma (opcional)

Crea un destino de pruebas en el portal, emite un documento y responde 2xx. El caso se marca cuando hay una entrega con respuesta 2xx de un documento de pruebas, posterior a la creación de tu credencial. Es una detección aproximada: el ECF no puede saber si tu sistema verificó la firma, así que verifícala siempre. Ver [Webhooks](webhooks.md).

### Caso 12 · Anular números no usados (opcional)

Anula un rango de números de tu secuencia de pruebas que no usaste:

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

Más en [Corregir y anular](corregir-y-anular.md#anecf).
