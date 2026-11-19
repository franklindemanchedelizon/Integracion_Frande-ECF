<!-- Generado desde https://ecf.frandeone.com/developers/docs/webhooks.html · no editar a mano: se regenera desde el ECF -->


# Webhooks y verificación de firma

_En vez de consultar el estado una y otra vez, el ECF te avisa con un POST a tu servidor cuando algo cambia._

## Destinos por ambiente

- Los destinos se crean y administran en el portal, en _Credenciales de API_: uno o varios por ambiente, con la URL, los eventos que quieres y un **secreto de firma**.
- Un **destino de Pruebas** (TesteCF y CerteCF) recibe solo eventos de pruebas; uno de **Producción** (eCF) recibe solo eventos de producción. Un evento de pruebas **nunca** llega a un destino de producción.
- En producción la URL debe ser `https`. El ECF rechaza direcciones internas o no públicas.
- El secreto se muestra **una sola vez**. Al rotarlo, el anterior deja de valer en el acto.

Con tu credencial puedes _consultar_ los destinos y las entregas de su ambiente (solo lectura, sin secretos):

GET `/v1/{env}/webhooks`

GET `/v1/{env}/webhooks/entregas`

También hay `POST /v1/api/webhooks/test`, que envía el evento `webhook.test` a tu destino original, y `GET /v1/api/webhooks/deliveries` para su historial. Crear, cambiar, rotar el secreto, probar un destino y reenviar una entrega fallida se hace solo desde el portal.

## Eventos

| Evento | Cuándo | Disponible |
|---|---|---|
| `ecf.status_update` | Un documento cambió de estado ante la DGII (el aviso de siempre). | Disponible |
| `ecf.accepted` | La DGII aceptó el documento. | Disponible |
| `ecf.conditionally_accepted` | La DGII aceptó el documento con observaciones (aceptado condicional). | Disponible |
| `ecf.rejected` | La DGII rechazó el documento. | Disponible |
| `ecf.received` | Llegó un e-CF de un proveedor a tu cuenta. | Disponible |
| `ecf.commercial_status` | Un comprador aprobó o rechazó comercialmente un documento tuyo. | Disponible |
| `ecf.buyer_delivery` | Resultado final de la entrega del documento al comprador. | Disponible |
| `anecf.completed` | Terminó una anulación de números (ANECF) ante la DGII. | Disponible |
| `certificate.expiring` | Tu certificado digital vence pronto. Solo llega a destinos de producción. | Disponible |
| `quota.threshold` | Tu cuenta llegó a un umbral del límite mensual de documentos. | Próximamente |
| `contingency.started` | Un documento entró en contingencia. | Próximamente |
| `contingency.ended` | Se vació la contingencia. | Próximamente |

El evento `webhook.test` lo envía el botón «Probar» del portal.

## El aviso

Un `POST ` con `Content-Type: application/json`. El `ecf.status_update`, el aviso de siempre, trae:

```json
{
  "event": "ecf.status_update",
  "internalTrackId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "encf": "E320000000001",
  "estado": "aceptado",
  "dgiiCode": "1",
  "dgiiMessage": "Aceptado",
  "trackId": "bb97dcf3-5566-4480-b81e-0ff49af80f3f",
  "timestamp": "2026-10-08T15:00:00.000Z"
}
```

Los eventos derivados (`ecf.accepted`, `ecf.conditionally_accepted` y `ecf.rejected`) llevan el mismo cuerpo con su `event` y el campo `environment` (`prueba` o `produccion`). El aviso del estado final sale **una sola vez** por documento y estado, aunque llegue después del primer envío. Los demás eventos traen `event`, `environment`, `timestamp` y sus datos:

| Evento | Campos principales |
|---|---|
| `ecf.received` | `encf`, `ecfType`, `rncEmisor`, `razonSocial`, `fechaEmision`, `total`, `receivedId`, `arecfCodigo` |
| `ecf.commercial_status` | `encf`, `ecfType`, `comercialEstado`, `comercialMotivo`, `comercialAt`, `rncComprador`, `documentId` |
| `ecf.buyer_delivery` | `encf`, `ecfType`, `rncComprador`, `estado`, `mensaje`, `intentos`, `deliveredAt` |
| `anecf.completed` | `anulacionId`, `estado`, `trackId`, `totalAnulados`, `dgiiCode`, `dgiiMessage` |
| `certificate.expiring` | `expiresAt`, `daysLeft`, `subject`, `serial` |

## Encabezados

| Encabezado | Qué trae |
|---|---|
| `X-ECF-Signature` | `sha256=` seguido del HMAC-SHA256 en hexadecimal (minúsculas) de `timestamp.nonce.cuerpo`, con el secreto del destino. |
| `X-ECF-Timestamp` | Segundos desde 1970 (hora Unix) en que se firmó. |
| `X-ECF-Nonce` | Valor único por entrega, incluido en la firma. |
| `X-ECF-Event` | El evento (`ecf.status_update`…). |
| `X-ECF-Environment` | `prueba` o `produccion`. |
| `X-ECF-Delivery-Id` | Identificador de la entrega; el mismo si se reenvía. |

## Verifica la firma

Antes de confiar en un aviso, comprueba tres cosas con el **cuerpo exacto** que recibiste (sin volver a serializar el JSON):

1. **La firma.** Calcula `HMAC-SHA256(secreto, timestamp + "." + nonce + "." + cuerpo)` en hexadecimal, antepón `sha256=` y compara con `X-ECF-Signature` en tiempo constante.
2. **La hora.** Rechaza el aviso si `X-ECF-Timestamp` se aleja más de **5 minutos** de tu hora (protege contra reenvíos de un aviso viejo).
3. **El nonce.** Guarda los nonces vistos y rechaza uno repetido.

```bash
# Simula un aviso firmado para probar TU receptor (no llama al ECF).
SECRETO="el-secreto-del-destino"
CUERPO='{"event":"ecf.status_update","encf":"E320000000001","estado":"aceptado","timestamp":"2026-10-08T15:00:00.000Z"}'
TS=$(date +%s)
NONCE=$(openssl rand -hex 16)
FIRMA="sha256=$(printf '%s.%s.%s' "$TS" "$NONCE" "$CUERPO" | openssl dgst -sha256 -hmac "$SECRETO" | sed 's/^.* //')"

curl -X POST "https://tu-servidor.example/ecf/webhook" \
  -H "Content-Type: application/json" \
  -H "X-ECF-Timestamp: $TS" \
  -H "X-ECF-Nonce: $NONCE" \
  -H "X-ECF-Signature: $FIRMA" \
  -d "$CUERPO"
```

```php
<?php
$secreto = getenv('ECF_WEBHOOK_SECRET');
$cuerpo = file_get_contents('php://input');            // el cuerpo EXACTO, sin reformatear
$ts = $_SERVER['HTTP_X_ECF_TIMESTAMP'] ?? '';
$nonce = $_SERVER['HTTP_X_ECF_NONCE'] ?? '';
$recibida = $_SERVER['HTTP_X_ECF_SIGNATURE'] ?? '';

$esperada = 'sha256=' . hash_hmac('sha256', $ts . '.' . $nonce . '.' . $cuerpo, $secreto);
$reciente = $ts !== '' && abs(time() - (int) $ts) <= 300;   // 5 minutos de tolerancia
$valida = $reciente && $recibida !== '' && hash_equals($esperada, $recibida);
// Guarda el nonce (tabla o caché) y rechaza los que ya viste.

if (!$valida) { http_response_code(401); exit; }
$aviso = json_decode($cuerpo, true);
// ...procesa $aviso['event'], $aviso['encf'], $aviso['estado'] sin duplicar efectos...
http_response_code(200);                                  // responde 2xx en menos de 10 segundos
```

```javascript
const crypto = require('crypto');
const express = require('express');

const SECRETO = process.env.ECF_WEBHOOK_SECRET;   // el secreto del destino (se ve una sola vez al crearlo)
const TOLERANCIA_SEG = 300;                       // 5 minutos
const nonceVistos = new Map();                    // en producción usa Redis o tu base de datos

function firmaValida(cuerpoCrudo, h) {
  const ts = String(h['x-ecf-timestamp'] || '');
  const nonce = String(h['x-ecf-nonce'] || '');
  const recibida = String(h['x-ecf-signature'] || '');
  if (!ts || !nonce || !recibida) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > TOLERANCIA_SEG) return false;   // aviso viejo
  if (nonceVistos.has(nonce)) return false;                                      // repetición
  const esperada = 'sha256=' + crypto.createHmac('sha256', SECRETO)
    .update(ts + '.' + nonce + '.').update(cuerpoCrudo).digest('hex');
  const a = Buffer.from(recibida);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  nonceVistos.set(nonce, Date.now());
  return true;
}

const app = express();
// express.raw conserva el cuerpo EXACTO que firmó el ECF.
app.post('/ecf/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!firmaValida(req.body, req.headers)) return res.sendStatus(401);
  const aviso = JSON.parse(req.body.toString('utf8'));
  // ...procesa aviso.event, aviso.encf, aviso.estado sin duplicar efectos...
  res.sendStatus(200);                              // responde 2xx en menos de 10 segundos
});
app.listen(3000);
```

```python
import hashlib
import hmac
import os
import time

from flask import Flask, request

SECRETO = os.environ["ECF_WEBHOOK_SECRET"].encode()
TOLERANCIA_SEG = 300                      # 5 minutos
nonce_vistos = set()                      # en producción usa Redis o tu base de datos

app = Flask(__name__)

def firma_valida(cuerpo_crudo: bytes, h) -> bool:
    ts = h.get("X-ECF-Timestamp", "")
    nonce = h.get("X-ECF-Nonce", "")
    recibida = h.get("X-ECF-Signature", "")
    if not (ts and nonce and recibida) or not ts.isdigit():
        return False
    if abs(time.time() - int(ts)) > TOLERANCIA_SEG or nonce in nonce_vistos:
        return False
    mensaje = (ts + "." + nonce + ".").encode() + cuerpo_crudo
    esperada = "sha256=" + hmac.new(SECRETO, mensaje, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(esperada, recibida):
        return False
    nonce_vistos.add(nonce)
    return True

@app.post("/ecf/webhook")
def webhook():
    if not firma_valida(request.get_data(), request.headers):   # get_data() es el cuerpo exacto
        return "", 401
    aviso = request.get_json()
    # ...procesa aviso["event"], aviso["encf"], aviso["estado"] sin duplicar efectos...
    return "", 200                                              # responde 2xx en menos de 10 segundos
```

```csharp
using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;

var app = WebApplication.CreateBuilder(args).Build();
var secreto = Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("ECF_WEBHOOK_SECRET")!);
var nonceVistos = new ConcurrentDictionary<string, DateTime>();   // en producción usa Redis o tu base de datos

app.MapPost("/ecf/webhook", async (HttpRequest req) =>
{
    using var ms = new MemoryStream();
    await req.Body.CopyToAsync(ms);
    var cuerpo = ms.ToArray();                                   // los bytes EXACTOS que firmó el ECF

    var ts = req.Headers["X-ECF-Timestamp"].ToString();
    var nonce = req.Headers["X-ECF-Nonce"].ToString();
    var recibida = req.Headers["X-ECF-Signature"].ToString();
    if (!long.TryParse(ts, out var segundos) || nonce == "" || recibida == "") return Results.Unauthorized();
    if (Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - segundos) > 300) return Results.Unauthorized();

    var mensaje = Encoding.UTF8.GetBytes(ts + "." + nonce + ".").Concat(cuerpo).ToArray();
    using var hmac = new HMACSHA256(secreto);
    var esperada = "sha256=" + Convert.ToHexString(hmac.ComputeHash(mensaje)).ToLowerInvariant();
    var iguales = CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(esperada), Encoding.UTF8.GetBytes(recibida));
    if (!iguales || !nonceVistos.TryAdd(nonce, DateTime.UtcNow)) return Results.Unauthorized();

    // ...procesa el aviso (JSON en "cuerpo") sin duplicar efectos...
    return Results.Ok();                                         // responde 2xx en menos de 10 segundos
});

app.Run();
```

> ℹ️ La firma se calcula de nuevo en cada reintento (con hora y nonce nuevos), así que el mismo aviso reenviado trae una firma distinta pero el mismo `X-ECF-Delivery-Id`. Usa el identificador del documento y el estado para no procesar dos veces el mismo cambio.

> !

Un destino sin secreto recibe los avisos sin firma. Es el comportamiento del webhook original; los destinos nuevos exigen secreto. No aceptes avisos sin firma en producción.

## Cómo responder y qué pasa si falla

- Responde con cualquier **2xx en menos de 10 segundos**. Procesa lo pesado después, en una cola de tu lado.
- Si respondes otra cosa, o no respondes, la entrega se marca fallida y se **reintenta** a los ~1, 5, 30 y 120 minutos (con una variación de más o menos 10 %). Son 5 intentos en total; después se abandona.
- Las entregas fallidas o abandonadas se pueden **reenviar desde el portal**, y el historial está en `GET /v1/{env}/webhooks/entregas`.
- Tus respuestas no afectan la emisión: un webhook caído nunca frena la facturación.
