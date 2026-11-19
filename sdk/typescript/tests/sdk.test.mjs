// Pruebas del SDK compilado (npm run build primero). Sin red: fetch se reemplaza por uno falso.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { FrandeEcf, FrandeEcfError, verificarWebhook } from '../dist/index.js';

function firmar(secreto, cuerpo, ts, nonce) {
  return 'sha256=' + createHmac('sha256', secreto).update(`${ts}.${nonce}.${cuerpo}`, 'utf8').digest('hex');
}

test('webhook: firma válida, alterada, vieja y nonce repetido', () => {
  const secreto = 's3cr3t', cuerpo = '{"event":"ecf.accepted"}', ts = String(Math.floor(Date.now() / 1000)), nonce = randomUUID();
  const firma = firmar(secreto, cuerpo, ts, nonce);
  assert.equal(verificarWebhook({ secreto, cuerpoCrudo: cuerpo, firma, timestamp: ts, nonce }), true);
  assert.equal(verificarWebhook({ secreto, cuerpoCrudo: cuerpo + ' ', firma, timestamp: ts, nonce }), false);
  assert.equal(verificarWebhook({ secreto, cuerpoCrudo: cuerpo, firma, timestamp: ts, nonce, ahora: Number(ts) + 400 }), false);
  assert.equal(verificarWebhook({ secreto, cuerpoCrudo: cuerpo, firma, timestamp: ts, nonce, nonceYaVisto: () => true }), false);
  assert.equal(verificarWebhook({ secreto, cuerpoCrudo: Buffer.from(cuerpo), firma, timestamp: ts, nonce }), true);
});

test('emitir: manda la credencial, la Idempotency-Key y la ruta del ambiente', async () => {
  let visto;
  globalThis.fetch = async (url, init) => {
    visto = { url, init };
    return new Response(JSON.stringify({ success: true, data: { ecf: 'E310000000001', internalTrackId: 'abc' } }), { status: 201 });
  };
  const ecf = new FrandeEcf({ apiKey: 'foecf_test_x', ambiente: 'TesteCF' });
  const r = await ecf.emitir({ ECF: {} }, { idempotencyKey: 'venta-1' });
  assert.equal(r.data.ecf, 'E310000000001');
  assert.equal(visto.url, 'https://ecf.frandeone.com/v1/TesteCF/documentos-ecf');
  assert.equal(visto.init.method, 'POST');
  assert.equal(visto.init.headers['X-API-Key'], 'foecf_test_x');
  assert.equal(visto.init.headers['Idempotency-Key'], 'venta-1');
});

test('soloValidar agrega ?validate=true', async () => {
  let url;
  globalThis.fetch = async (u) => { url = u; return new Response('{"success":true,"data":{}}', { status: 200 }); };
  await new FrandeEcf({ apiKey: 'k', ambiente: 'eCF' }).emitir({}, { idempotencyKey: 'x', soloValidar: true });
  assert.equal(url, 'https://ecf.frandeone.com/v1/eCF/documentos-ecf?validate=true');
});

test('errores: código, requestId y si se puede reintentar', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: { code: 'ECF_VALIDATION_FAILED', message: 'mal' }, requestId: 'r1' }), { status: 400 });
  await assert.rejects(new FrandeEcf({ apiKey: 'k' }).porEncf('E31'), (e) => e instanceof FrandeEcfError && e.status === 400 && e.code === 'ECF_VALIDATION_FAILED' && e.requestId === 'r1' && e.reintentable === false);
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  await assert.rejects(new FrandeEcf({ apiKey: 'k' }).cuenta(), (e) => e.reintentable === true);
  globalThis.fetch = async () => { throw new Error('sin red'); };
  await assert.rejects(new FrandeEcf({ apiKey: 'k' }).cuenta(), (e) => e.status === 0 && e.reintentable === true);
});
