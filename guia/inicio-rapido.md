<!-- Generado desde https://ecf.frandeone.com/developers/docs/inicio-rapido.html · no editar a mano: se regenera desde el ECF -->

Pégalo en tu asistente para que te ayude a integrar. También puedes darle el enlace de [llms.txt](https://ecf.frandeone.com/developers/docs/llms.txt).

# Inicio rápido

_De cero a tu primer e-CF de prueba en TesteCF, con curl. Todo lo de esta página es de pruebas: no tiene efecto fiscal._

> !

**Solo TesteCF.** Una credencial de pruebas (`foecf_test_…`) solo funciona en `/v1/TesteCF`. Si la apuntas a `/v1/eCF` recibes 403 `ENVIRONMENT_NOT_ALLOWED_FOR_KEY`; no puede emitir en producción.

## Antes de empezar

- Una cuenta de Frande One ECF con el **correo verificado**. Sin verificar, la emisión responde 403 `EMAIL_NOT_VERIFIED`.
- Un **certificado digital .p12** cargado en el portal (Certificados). Hasta en pruebas hace falta para firmar: sin él, la emisión responde 400 `NO_CERT`. Validar con `?validate=true` no lo necesita.
- Tu **credencial de pruebas**: en el portal, _Credenciales de API_, selector _Pruebas_, _Crear credencial_. Tiene la forma `foecf_test_<8 caracteres>_<48 caracteres>` y se muestra **una sola vez**: guárdala.

En los ejemplos se usa la variable de entorno `ECF_API_KEY`:

```bash
export ECF_API_KEY="foecf_test_…"   # pega aquí tu credencial de pruebas
```

## 1. Prueba la conexión

`GET /v1/TesteCF/cuenta` solo lee: dice quién eres y con qué ambiente. Nunca emite ni escribe nada. Es el caso 1 de los [casos de prueba](casos-de-prueba.md).

```bash
curl "https://ecf.frandeone.com/v1/TesteCF/cuenta" \
  -H "X-API-Key: $ECF_API_KEY"
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/cuenta');
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
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/cuenta', {
    headers: { 'X-API-Key': process.env.ECF_API_KEY },
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

r = requests.get(
    "https://ecf.frandeone.com/v1/TesteCF/cuenta",
    headers={"X-API-Key": os.environ["ECF_API_KEY"]},
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));

var respuesta = await http.GetAsync("https://ecf.frandeone.com/v1/TesteCF/cuenta");
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

```json
{
  "success": true,
  "data": {
    "conectado": true,
    "rnc": "131234567",
    "nombre": "MI EMPRESA SRL",
    "ambiente_efectivo": "TesteCF",
    "credencial": {
      "prefijo": "foecf_test_",
      "ambiente": "prueba",
      "etiqueta": "Mi sistema",
      "sucursal": "001"
    },
    "certificado": {
      "cargado": true,
      "vence": "2027-03-01T00:00:00.000Z"
    },
    "plan": {
      "nombre": "Plan de ejemplo",
      "documentos_mes": 0,
      "limite_mes": 0
    }
  },
  "requestId": "8b1f0a6e-0c58-4b54-9b57-2f6d4d0a0e11"
}
```

Si recibes 401 `API_KEY_INVALID`, la clave está mal copiada, fue revocada o rotada. Si recibes 403 `ENVIRONMENT_NOT_ALLOWED_FOR_KEY`, estás usando una ruta que no es `/v1/TesteCF`.

## 2. Valida un documento sin emitirlo

Guarda este E32 (factura de consumo menor de RD$ 250,000) como `e32.json`. Con `?validate=true` el ECF revisa los campos y el esquema oficial de la DGII, y **no firma, no numera, no guarda ni envía nada**.

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

```bash
curl -X POST "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf?validate=true" \
  -H "X-API-Key: $ECF_API_KEY" \
  -H "Content-Type: application/json" \
  --data @e32.json
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
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf?validate=true', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.ECF_API_KEY,
      'Content-Type': 'application/json',
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
peticion.Content = new StringContent(await File.ReadAllTextAsync("e32.json"), Encoding.UTF8, "application/json");

var respuesta = await http.SendAsync(peticion);
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

```json
{
  "success": true,
  "data": {
    "valid": true,
    "environment": "TesteCF"
  },
  "requestId": "8b1f0a6e-0c58-4b54-9b57-2f6d4d0a0e12"
}
```

Si algo falla, recibes 400 `ECF_VALIDATION_FAILED` o `ECF_XSD_INVALID` con la lista de campos a corregir en `error.details.validationErrors`. Lee el detalle en [Emitir un e-CF](emitir.md).

## 3. Emite

Es el mismo documento, sin `?validate=true` y con la cabecera `Idempotency-Key`, que con tu credencial `foecf_*` es **obligatoria** (ver [Idempotencia](idempotencia.md)). El número `eNCF` lo asigna tu sistema: usa uno que no hayas usado.

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

Respuesta **201 Created**. El ECF firma el documento y responde de inmediato; el envío a la DGII ocurre después, en segundo plano:

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
  "requestId": "8b1f0a6e-0c58-4b54-9b57-2f6d4d0a0e13"
}
```

Guarda `internalTrackId`: es el identificador con el que consultas todo lo demás. `isRFCE: true` significa que a la DGII se envía el resumen (E32 menor de RD$ 250,000).

## 4. Consulta el estado

El documento nace en `en_cola` y la DGII lo lleva a `aceptado` o `rechazado`. Pregunta con el `internalTrackId` que recibiste:

```bash
curl "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/status" \
  -H "X-API-Key: $ECF_API_KEY"
```

```php
<?php
$ch = curl_init('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/status');
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
  const respuesta = await fetch('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/status', {
    headers: { 'X-API-Key': process.env.ECF_API_KEY },
  });
  console.log(respuesta.status, await respuesta.json());
})();
```

```python
import os
import requests

r = requests.get(
    "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/status",
    headers={"X-API-Key": os.environ["ECF_API_KEY"]},
    timeout=30,
)
print(r.status_code, r.json())
```

```csharp
using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(30) };
http.DefaultRequestHeaders.Add("X-API-Key", Environment.GetEnvironmentVariable("ECF_API_KEY"));

var respuesta = await http.GetAsync("https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d/status");
Console.WriteLine((int)respuesta.StatusCode + " " + await respuesta.Content.ReadAsStringAsync());
```

Mira `data.estado_dgii`. Todos los estados están en [Estados, consultas y archivos](estados-y-consultas.md). En vez de consultar una y otra vez, puedes recibir el aviso por [webhook](webhooks.md).

## 5. Descarga el XML y el PDF

```bash
ID="a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
curl -o E320000000001.xml "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/$ID/xml" -H "X-API-Key: $ECF_API_KEY"
curl -o E320000000001.pdf "https://ecf.frandeone.com/v1/TesteCF/documentos-ecf/$ID/pdf" -H "X-API-Key: $ECF_API_KEY"
```

El XML firmado es el documento con validez legal; el PDF es la representación impresa.

## Qué sigue

- Conecta tu sistema con los datos que te pide: [Conecta tu sistema](conecta-tu-sistema.md).
- Completa los casos de prueba para saber que tu sistema está listo: [Casos de prueba del sandbox](casos-de-prueba.md).
- Recibe los avisos en tu servidor: [Webhooks y verificación de firma](webhooks.md).
- Cuando tu cuenta esté certificada ante la DGII, crea tu credencial de producción: [Ambientes y credenciales](ambientes-y-credenciales.md).
