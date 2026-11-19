# SDK TypeScript / Node de Frande ECF

Node 18+ (usa `fetch` nativo), sin dependencias en tiempo de ejecución.

```bash
npm install @frande/ecf   # cuando se publique; mientras tanto, copia src/index.ts
```

```ts
import { FrandeEcf, FrandeEcfError, verificarWebhook } from '@frande/ecf';

const ecf = new FrandeEcf({ apiKey: process.env.FRANDE_ECF_KEY!, ambiente: 'TesteCF' });

console.log(await ecf.cuenta());                       // probar la conexión (no emite)

try {
  const r = await ecf.emitir(payload, { idempotencyKey: `venta-${venta.id}` });
  console.log(r.data?.ecf, r.data?.securityCode, r.data?.qr_url);
} catch (e) {
  if (e instanceof FrandeEcfError && e.reintentable) {
    // reintenta más tarde con LA MISMA idempotencyKey: no se emite dos veces
  } else throw e;
}

const pdf = await ecf.pdf(internalTrackId);            // Uint8Array
```

Webhook (Express, cuerpo crudo):

```ts
app.post('/webhooks/ecf', express.raw({ type: 'application/json' }), (req, res) => {
  const ok = verificarWebhook({
    secreto: process.env.FRANDE_ECF_WEBHOOK_SECRET!,
    cuerpoCrudo: req.body,
    firma: req.header('X-ECF-Signature'),
    timestamp: req.header('X-ECF-Timestamp'),
    nonce: req.header('X-ECF-Nonce'),
    nonceYaVisto: (n) => cache.has(n),                 // guarda los nonces ~10 min
  });
  if (!ok) return res.sendStatus(401);
  res.sendStatus(200);                                  // responde rápido, procesa después
  procesar(req.header('X-ECF-Event'), JSON.parse(req.body.toString('utf8')));
});
```
