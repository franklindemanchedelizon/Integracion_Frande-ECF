<!-- Generado desde https://ecf.frandeone.com/developers/docs/emitir.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Emitir un e-CF

_Un solo endpoint emite los diez tipos de comprobante. Aquí tienes cómo se arma el cuerpo y un ejemplo completo de cada tipo._

POST `/v1/{env}/documentos-ecf`

Autenticación con tu credencial, `Content-Type: application/json` y, con credenciales `foecf_*`, `Idempotency-Key`. Límite de 30 emisiones por minuto y 5 MB por cuerpo.

## Cómo funciona

1. Recibes el JSON del documento. El ECF revisa los campos y el esquema oficial de la DGII **antes** de firmar.
2. Firma el XML con tu certificado, genera el código de seguridad y el QR, y guarda el documento. Responde **201** de inmediato.
3. Envía a la DGII en segundo plano, con reintentos. El estado final llega por consulta o por [webhook](webhooks.md).

La respuesta de la emisión no trae el estado ante la DGII: nace en `en_cola`.

```bash
curl -X POST "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf" \
  -H "X-API-Key: $ECF_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: venta-1042-emitir" \
  --data @e32.json
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . getenv('ECF_API_KEY'),
        'Content-Type: application/json',
        'Idempotency-Key: venta-1042-emitir',
    ],
    CURLOPT_POSTFIELDS => file_get_contents('e32.json'),
]);
$cuerpo = json_decode(curl_exec($ch), true);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo $http, " ", json_encode($cuerpo, JSON_UNESCAPED_UNICODE), PHP_EOL;
```

```javascript
// Node 18 o superior (fetch incluido)
const fs = require('fs');

(async () => {
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.ECF_API_KEY,
      'Content-Type': 'application/json',
      'Idempotency-Key': 'venta-1042-emitir',
    },
    body: fs.readFileSync('e32.json', 'utf8'),
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

with open("e32.json", encoding="utf-8") as f:
    documento = f.read()

r = requests.post(
    "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf",
    headers={
        "X-API-Key": os.environ["ECF_API_KEY"],
        "Content-Type": "application/json",
        "Idempotency-Key": "venta-1042-emitir",
    },
    data=documento.encode("utf-8"),
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using System.Text;

using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
var peticion = new HttpRequestMessage(HttpMethod.Post, "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf");
peticion.Headers.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));
peticion.Headers.Add("Idempotency-Key", "venta-1042-emitir");
peticion.Content = new StringContent(await File.ReadAllTextAsync("e32.json"), Encoding.UTF8, "application/json");

var respuesta = await http.SendAsync(peticion);
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

```json
{
  "success": true,
  "data": {
    "rnc": "131234567",
    "ecf": "E320000000001",
    "internalTrackId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "securityCode": "A1B2C3",
    "qr_url": "https://…",
    "signedDate": "2026-10-08T14:30:00.000Z",
    "isRFCE": true
  },
  "requestId": "8b1f0a6e-0c58-4b54-9b57-2f6d4d0a0e14"
}
```

## Valida antes de emitir

`POST /v1/{env}/documentos-ecf?validate=true` corre las mismas dos capas que la emisión (reglas de campos y esquema XSD de la DGII) y responde 200 `{"valid": true}` o 400 con la lista de errores. No firma, no numera, no guarda, no gasta números y no pide `Idempotency-Key`. Es el caso 2 de los [casos de prueba](casos-de-prueba.md).

```bash
curl -X POST "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf?validate=true" \
  -H "X-API-Key: $ECF_API_KEY" \
  -H "Content-Type: application/json" \
  --data @e31.json
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf?validate=true');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'X-API-Key: ' . getenv('ECF_API_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => file_get_contents('e31.json'),
]);
$cuerpo = json_decode(curl_exec($ch), true);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo $http, " ", json_encode($cuerpo, JSON_UNESCAPED_UNICODE), PHP_EOL;
```

```javascript
// Node 18 o superior (fetch incluido)
const fs = require('fs');

(async () => {
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf?validate=true', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.ECF_API_KEY,
      'Content-Type': 'application/json',
    },
    body: fs.readFileSync('e31.json', 'utf8'),
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

with open("e31.json", encoding="utf-8") as f:
    documento = f.read()

r = requests.post(
    "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf?validate=true",
    headers={
        "X-API-Key": os.environ["ECF_API_KEY"],
        "Content-Type": "application/json",
    },
    data=documento.encode("utf-8"),
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using System.Text;

using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
var peticion = new HttpRequestMessage(HttpMethod.Post, "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf?validate=true");
peticion.Headers.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));
peticion.Content = new StringContent(await File.ReadAllTextAsync("e31.json"), Encoding.UTF8, "application/json");

var respuesta = await http.SendAsync(peticion);
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

## Reglas del documento

- El cuerpo es el e-CF en JSON con la estructura del XML oficial de la DGII (Formato e-CF v1.0): `ECF` con `Encabezado`, `DetallesItems` y, en notas, `InformacionReferencia`.
- **El orden de las claves importa**: el ECF arma el XML en el orden en que llegan y el esquema de la DGII fija el orden. Respeta el de los ejemplos.
- **No envíes `FechaHoraFirma`**: el ECF la pone al firmar, en hora de República Dominicana.
- Las fechas del documento van en `DD-MM-AAAA` (por ejemplo `08-10-2026`), sin hora. `FechaEmision` es obligatoria y no puede ser posterior a mañana.
- `TipoeCF` debe coincidir con los dígitos 2 y 3 del `eNCF` (el 31 de `E310000000001`).
- `IndicadorMontoGravado` declara cómo vienen los montos de las líneas: `0` si no incluyen ITBIS (precio base, lo habitual) y `1` si lo incluyen. Declarar `1` con líneas sin ITBIS hace que la DGII responda «aceptado condicional».
- Si `TipoPago` es `2` (crédito), agrega `FechaLimitePago`. Si envías `TablaFormasPago`, la suma de los `MontoPago` debe igualar `MontoTotal` (tolerancia de 0.05).
- `IndicadorFacturacion` por línea: `1` gravado al 18 %, `2` al 16 %, `3` tasa cero, `4` exento. Los montos admiten uno o dos decimales.
- El `RNCComprador` es obligatorio en los tipos 31, 41 y 45 y en el E32 de RD$ 250,000 o más. En el 44 y el 46 el comprador lleva `RNCComprador` o `IdentificadorExtranjero` (diplomático en el 44, comprador no residente en el 46).

### Tus propios datos: referencia_externa y sucursal

Dos campos opcionales de primer nivel (fuera de `ECF`) que el ECF guarda pero **no incluye en el XML de la DGII**:

| Campo | Formato | Para qué |
|---|---|---|
| `referencia_externa` | Texto de hasta 100 caracteres, sin saltos de línea | Tu identificador de la venta. Encuentras el documento con `GET …/documentos-ecf/por-referencia/{ref}`. Una referencia repetida en el mismo ambiente devuelve el documento existente (200, `duplicado_por_referencia: true`) en vez de emitir otro, salvo que el anterior haya sido rechazado. |
| `sucursal` | De 3 a 10 caracteres alfanuméricos (por ejemplo `001`) | La sucursal que emitió. Si no la envías se usa la de la credencial. Filtra la lista con `?sucursal=`. |

```json
{
  "referencia_externa": "POS2-000123",
  "sucursal": "001",
  "ECF": {
    "Encabezado": "…",
    "DetallesItems": "…"
  }
}
```

Con formato inválido recibes 400 `INVALID_REFERENCIA_EXTERNA` o `INVALID_SUCURSAL`.

## Un ejemplo por tipo

Son ejemplos mínimos: cámbialos por los datos de tu operación. **Todos pasan la validación del propio ECF** (una prueba automática de esta documentación los envía por la misma validación de `?validate=true` en cada cambio). Confirma las reglas fiscales de cada tipo con tu contador.

> i

Los ejemplos usan RNC ficticios (`131234567` de emisor). Para **validar** sirven tal cual; para **emitir**, cambia `RNCEmisor` por el RNC de tu empresa, que debe ser el mismo de tu cuenta y de tu certificado, o la DGII rechazará el documento.

### E31 · Factura de crédito fiscal

Para clientes con RNC que usan la factura para su crédito fiscal. Exige comprador y `FechaVencimientoSecuencia`.

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

### E32 · Factura de consumo menor de RD$ 250,000 (RFCE)

La del punto de venta. El comprador es opcional. Por debajo de RD$ 250,000 el ECF envía a la DGII el **resumen** (RFCE) en lugar del e-CF completo, y la respuesta trae `isRFCE: true`. Sin `FechaVencimientoSecuencia` en este tipo.

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

### E32 · Factura de consumo de RD$ 250,000 o más

Se envía completa y exige el `RNCComprador`.

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

### E33 · Nota de débito

Aumenta un documento ya emitido. Exige `InformacionReferencia`. Más en [Corregir y anular](corregir-y-anular.md).

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

### E34 · Nota de crédito

Reduce o anula un documento ya emitido. Exige `IndicadorNotaCredito` (`0` dentro de 30 días, `1` fuera) y `InformacionReferencia`. El `NCFModificado` debe existir en tu cuenta: emite primero ese documento.

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

### E41 · Comprobante de compras

Compras a proveedores informales. Cada línea lleva su bloque `Retencion` y los totales llevan `TotalITBISRetenido`.

Una línea de servicio (`IndicadorBienoServicio` 2) debe declarar `MontoISRRetenido`, aunque sea 0. `IndicadorFacturacion` 0 no se admite y `DescuentoMonto` requiere `TablaSubDescuento`. Si la DGII rechaza por una de estas causas, el número queda consumido: el ECF las detiene antes de enviar.

Las claves del JSON van en el orden del XSD. La DGII no valida cuánto retienes: el cálculo es responsabilidad de tu sistema.

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "41",
        "eNCF": "E410000000001",
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
        "RazonSocialComprador": "PROVEEDOR DE PRUEBA"
      },
      "Totales": {
        "MontoGravadoTotal": "1000.00",
        "MontoGravadoI1": "1000.00",
        "ITBIS1": 18,
        "TotalITBIS": "180.00",
        "TotalITBIS1": "180.00",
        "MontoTotal": "1180.00",
        "TotalITBISRetenido": "180.00",
        "TotalISRRetencion": "20.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "1",
          "Retencion": {
            "IndicadorAgenteRetencionoPercepcion": 1,
            "MontoITBISRetenido": "180.00",
            "MontoISRRetenido": "20.00"
          },
          "NombreItem": "Servicio técnico",
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

### E43 · Gastos menores

Sin comprador.

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

### E44 · Regímenes especiales

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "44",
        "eNCF": "E440000000001",
        "FechaVencimientoSecuencia": "31-12-2027",
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
        "RazonSocialComprador": "ZONA FRANCA DE PRUEBA SRL"
      },
      "Totales": {
        "MontoExento": "1000.00",
        "MontoTotal": "1000.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "4",
          "NombreItem": "Servicio a régimen especial",
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

### E45 · Gubernamental

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "45",
        "eNCF": "E450000000001",
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
        "RNCComprador": "401000001",
        "RazonSocialComprador": "MINISTERIO DE PRUEBA"
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
          "NombreItem": "Servicio al gobierno",
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

### E46 · Exportaciones

Con tasa cero (`IndicadorFacturacion` `3`).

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "46",
        "eNCF": "E460000000001",
        "FechaVencimientoSecuencia": "31-12-2027",
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
        "IdentificadorExtranjero": "EIN123456789",
        "RazonSocialComprador": "IMPORTER OF TEST INC",
        "PaisComprador": "ESTADOS UNIDOS"
      },
      "Totales": {
        "MontoGravadoTotal": "1000.00",
        "MontoGravadoI3": "1000.00",
        "ITBIS3": 0,
        "TotalITBIS": "0.00",
        "TotalITBIS3": "0.00",
        "MontoTotal": "1000.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "3",
          "NombreItem": "Mercancía de exportación",
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

### E47 · Pagos al exterior

Sin comprador; cada línea lleva su `Retencion` con el ISR retenido.

```json
{
  "ECF": {
    "Encabezado": {
      "Version": "1.0",
      "IdDoc": {
        "TipoeCF": "47",
        "eNCF": "E470000000001",
        "FechaVencimientoSecuencia": "31-12-2027",
        "TipoPago": 1
      },
      "Emisor": {
        "RNCEmisor": "131234567",
        "RazonSocialEmisor": "MI EMPRESA SRL",
        "DireccionEmisor": "Calle Principal 1, San Pedro de Macorís",
        "FechaEmision": "08-10-2026"
      },
      "Totales": {
        "MontoExento": "1000.00",
        "MontoTotal": "1000.00",
        "TotalISRRetencion": "270.00"
      }
    },
    "DetallesItems": {
      "Item": [
        {
          "NumeroLinea": 1,
          "IndicadorFacturacion": "4",
          "Retencion": {
            "IndicadorAgenteRetencionoPercepcion": 1,
            "MontoISRRetenido": "270.00"
          },
          "NombreItem": "Servicio recibido del exterior",
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

## Forma de pago, crédito y descuentos

Estos fragmentos van dentro del ejemplo de su tipo. Se comprobaron en TesteCF con documentos reales.

| FormaPago | Significado | Cuándo |
|---|---|---|
| `1` | Efectivo | Contado en efectivo. |
| `2` | Cheque, transferencia o depósito | Pagos por banco. |
| `3` | Tarjeta de débito o crédito | Cobros con tarjeta. |
| `4` | Venta a crédito | Lo que queda por cobrar. |
| `5` | Bonos o certificados de regalo | En TesteCF la DGII lo devolvió como aceptado condicional; evítalo salvo que aplique. |
| `6` | Permuta | Pago con bienes. |
| `7` | Nota de crédito | Parte pagada con una nota anterior. |
| `8` | Otras formas de pago | Cualquier otra. |

### Un solo medio

```json
{
  "TipoPago": 1,
  "TablaFormasPago": {
    "FormaDePago": [
      {
        "FormaPago": 3,
        "MontoPago": "1180.00"
      }
    ]
  }
}
```

### Pago mixto

Una fila por medio. La suma de `MontoPago` debe igualar `MontoTotal` y no se repite una misma forma.

```json
{
  "TipoPago": 1,
  "TablaFormasPago": {
    "FormaDePago": [
      {
        "FormaPago": 1,
        "MontoPago": "590.00"
      },
      {
        "FormaPago": 3,
        "MontoPago": "590.00"
      }
    ]
  }
}
```

### Venta a crédito con abono inicial

`TipoPago` 2 exige `FechaLimitePago`. El abono va con su medio y el resto con la forma 4.

```json
{
  "TipoPago": 2,
  "FechaLimitePago": "29-11-2026",
  "TablaFormasPago": {
    "FormaDePago": [
      {
        "FormaPago": 2,
        "MontoPago": "500.00"
      },
      {
        "FormaPago": 4,
        "MontoPago": "680.00"
      }
    ]
  }
}
```

### Descuento en una línea

`DescuentoMonto` exige `TablaSubDescuento` justo después. `MontoItem` ya va con el descuento restado. Sin la tabla, la DGII rechaza con el mensaje 2020.

```json
{
  "NumeroLinea": 1,
  "IndicadorFacturacion": 1,
  "NombreItem": "Articulo",
  "IndicadorBienoServicio": 1,
  "CantidadItem": "2.00",
  "PrecioUnitarioItem": "1000.0000",
  "DescuentoMonto": "200.00",
  "TablaSubDescuento": {
    "SubDescuento": [
      {
        "TipoSubDescuento": "$",
        "MontoSubDescuento": "200.00"
      }
    ]
  },
  "MontoItem": "1800.00"
}
```

### E41: retenciones por línea

Cada línea declara lo retenido en `Retencion`. `TotalITBISRetenido` y `TotalISRRetencion` deben ser la suma de las líneas: si no, la DGII responde 11174 y el ECF lo detiene antes de firmar. Una línea de servicio declara `MontoISRRetenido` aunque sea 0.

```json
{
  "IndicadorBienoServicio": 2,
  "Retencion": {
    "IndicadorAgenteRetencionoPercepcion": 1,
    "MontoITBISRetenido": "90.00",
    "MontoISRRetenido": "75.00"
  }
}
```

## Códigos de modificación en E33 y E34

| Código | Para qué | Regla |
|---|---|---|
| `1` | Anula el comprobante | El monto debe ser exacto al balance del documento. Si no, `NC_BALANCE_INVALID`. |
| `2` | Corrige texto | En E34 el monto total va en cero. Con importes, la DGII rechaza con el mensaje 645 y el ECF lo detiene antes. |
| `3` | Corrige montos | Devolución parcial, descuento posterior o ajuste. No puede pasar del saldo. |
| `4` | Reemplaza un comprobante de contingencia | Solo para el e-CF que sustituye a un B. Va solo a la DGII, no al comprador. En E31 y E32 no lleva `RazonModificacion`. |
| `5` | Referencia una factura de consumo | Según el Formato e-CF. |

`RazonModificacion` es opcional, solo existe en E33 y E34, es texto libre de hasta 90 caracteres y no tiene catálogo de la DGII.

## Qué se detiene antes de emitir

Valida con `?validate=true` antes de emitir: no firma, no gasta el número y devuelve todos los problemas juntos. Cuenta dentro del límite de emisión.

| Se detiene en | Ejemplos |
|---|---|
| Validación del ECF (400) | eNCF mal formado, tipo que no coincide, RNC inválido o faltante, fechas, crédito sin `FechaLimitePago`, formas de pago que no suman, secuencia vencida, retenciones que no suman, código 2 con monto. |
| Esquema de la DGII (400) | Campo desconocido, orden incorrecto, valores fuera de catálogo, cantidades o precios negativos, razón de más de 90 caracteres. |
| Al emitir (400 o 422) | RNC emisor distinto al de la cuenta, e-NCF repetido, nota sin documento o por encima del saldo. |
| DGII | Secuencia no autorizada (135), reglas de cuadre de montos. Consulta el estado: lo aceptado condicional sigue siendo válido, pero revisa el mensaje. |

## Errores frecuentes al emitir

| Código | Qué pasó | Qué hacer |
|---|---|---|
| `ECF_VALIDATION_FAILED` (400) | Falta un campo o tiene un formato inválido. | Corrige cada línea de `error.details.validationErrors`. |
| `ECF_XSD_INVALID` (400) | El documento pasó las reglas del ECF pero no el esquema de la DGII (orden, nombre o valor). | Compara con el ejemplo del tipo; revisa el orden de las claves. |
| `XSD_VALIDATION_FAILED` (422) | Lo mismo al emitir. No se firmó nada. | Igual que el anterior. |
| `NO_CERT` / `CERT_EXPIRED` (400) | No hay certificado activo o está vencido. | Sube uno vigente en el portal. |
| `EMAIL_NOT_VERIFIED` (403) | El correo de la cuenta no está verificado. | Verifícalo desde el portal. |
| `ENCF_ALREADY_ISSUED` (409) | Ese e-NCF ya existe con otro contenido. | Usa el siguiente número libre. |
| `NC_BALANCE_INVALID` (422) | La nota excede el saldo del documento que modifica. | Reduce los montos de la nota. |
| DGII 2020 | Línea con descuento sin `TablaSubDescuento`. | Agrega la tabla: ver descuentos. |
| DGII 145 | Fecha de vencimiento de secuencia inválida. | Usa la fecha de tu rango autorizado. |
| DGII 135 | Número de secuencia no autorizada. | Emite con un número de tu rango. El rechazado no se reutiliza si `secuenciaUtilizada` es true. |
| DGII 615 | La nota debe igualar el total o balance disponible. | Con notas previas, anula por el balance o usa el código 3. |
| DGII 645 | Código 2 con monto. | Usa el código 3 para corregir montos. |
| DGII 11174 | `TotalISRRetencion` no coincide con las líneas. | Corrige el total. La DGII lo acepta como condicional. |
| DGII 4 | El certificado no está delegado para ese RNC. | Emite con el RNC de la cuenta. |
| `IDEMPOTENCY_KEY_REQUIRED` (400) | Falta `Idempotency-Key` con tu credencial `foecf_*`. | Agrégala. Ver Idempotencia. |

La lista completa está en el [catálogo de errores](errores.md).
