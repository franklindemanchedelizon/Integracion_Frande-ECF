/**
 * SDK de Frande ECF para TypeScript / Node 18+ (usa fetch nativo, sin dependencias).
 * Contrato: openapi/frande-ecf-v1.openapi.json · API: https://ecf.frandeone.com/v1
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export type Ambiente = 'TesteCF' | 'eCF';

export interface OpcionesCliente {
  /** Credencial del portal: foecf_test_... (TesteCF) o foecf_live_... (eCF). */
  apiKey: string;
  ambiente?: Ambiente;
  /** Por defecto https://ecf.frandeone.com/v1 */
  baseUrl?: string;
  /** Milisegundos por petición. Por defecto 30000. */
  timeoutMs?: number;
}

export interface Respuesta<T = any> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; [k: string]: unknown };
  requestId?: string;
}

export interface ResultadoEmision {
  rnc: string;
  ecf: string;
  internalTrackId: string;
  securityCode: string;
  qr_url: string;
  signedDate: string;
  isRFCE: boolean;
  [k: string]: unknown;
}

/** Error de la API con su código (ECF_VALIDATION_FAILED, IDEMPOTENCY_KEY_CONFLICT, ...) y el requestId para soporte. */
export class FrandeEcfError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly body?: unknown;

  constructor(message: string, status: number, code?: string, requestId?: string, body?: unknown) {
    super(message);
    this.name = 'FrandeEcfError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.body = body;
  }
  /** 5xx, 408 y 429: se puede reintentar con la misma Idempotency-Key. */
  get reintentable(): boolean {
    return this.status >= 500 || this.status === 408 || this.status === 429 || this.status === 0;
  }
}

export class FrandeEcf {
  private readonly apiKey: string;
  private readonly ambiente: Ambiente;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opciones: OpcionesCliente) {
    if (!opciones?.apiKey) throw new Error('Falta apiKey');
    this.apiKey = opciones.apiKey;
    this.ambiente = opciones.ambiente ?? 'TesteCF';
    this.baseUrl = (opciones.baseUrl ?? 'https://ecf.frandeone.com/v1').replace(/\/+$/, '');
    this.timeoutMs = opciones.timeoutMs ?? 30000;
  }

  /** Probar la conexión: RNC, ambiente efectivo y estado del certificado. No emite. */
  cuenta() { return this.json('GET', '/cuenta'); }

  /** Progreso de los casos de prueba de integración (solo credencial de pruebas). */
  pruebasIntegracion() { return this.json('GET', '/pruebas-integracion'); }

  /**
   * Emitir un e-CF. `idempotencyKey` debe ser único por venta (8 a 128 caracteres).
   * Con `soloValidar` no se envía a la DGII ni se gasta la secuencia.
   */
  emitir(payload: Record<string, unknown>, opciones: { idempotencyKey: string; soloValidar?: boolean }) {
    if (!opciones?.idempotencyKey && !opciones?.soloValidar) throw new Error('Falta idempotencyKey');
    const q = opciones.soloValidar ? '?validate=true' : '';
    return this.json<ResultadoEmision>('POST', `/documentos-ecf${q}`, payload, opciones.idempotencyKey);
  }

  porEncf(encf: string) { return this.json('GET', `/documentos-ecf/por-encf/${encodeURIComponent(encf)}`); }
  porReferencia(ref: string) { return this.json('GET', `/documentos-ecf/por-referencia/${encodeURIComponent(ref)}`); }
  documento(internalTrackId: string) { return this.json('GET', `/documentos-ecf/${encodeURIComponent(internalTrackId)}`); }
  /** Estado en vivo ante la DGII. */
  estado(internalTrackId: string) { return this.json('GET', `/documentos-ecf/${encodeURIComponent(internalTrackId)}/status`); }
  estadoVarios(internalTrackIds: string[]) { return this.json('POST', '/documentos-ecf/batch-status', { internalTrackIds }); }
  listar(params: Record<string, string | number> = {}) {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return this.json('GET', `/documentos-ecf${q ? `?${q}` : ''}`);
  }

  /** Representación impresa (PDF) como bytes. */
  pdf(internalTrackId: string) { return this.binario(`/documentos-ecf/${encodeURIComponent(internalTrackId)}/pdf`); }
  /** XML firmado como texto. */
  async xml(internalTrackId: string) {
    return new TextDecoder().decode(await this.binario(`/documentos-ecf/${encodeURIComponent(internalTrackId)}/xml`));
  }

  /** Anular secuencias no usadas (ANECF). Ej.: [{ desde: 'E310000000100', hasta: 'E310000000110' }] */
  anular(rangos: Array<{ desde: string; hasta: string }>, idempotencyKey: string) {
    return this.json('POST', '/anulacion-ecf', { rangos }, idempotencyKey);
  }

  /** Directorio DGII: si el comprador recibe e-CF electrónicamente. */
  directorio(rnc: string) { return this.json('GET', `/directorio/${encodeURIComponent(rnc)}`); }

  recibidos(params: Record<string, string | number> = {}) {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString();
    return this.json('GET', `/documentos-recibidos${q ? `?${q}` : ''}`);
  }
  /** Aprobación comercial (ACECF) de un e-CF recibido. */
  aprobarRecibido(id: string | number, idempotencyKey: string) {
    return this.json('POST', `/documentos-recibidos/${encodeURIComponent(String(id))}/approve`, {}, idempotencyKey);
  }
  /** Rechazo comercial (ACECF) de un e-CF recibido, con su motivo. */
  rechazarRecibido(id: string | number, motivo: string, idempotencyKey: string) {
    return this.json('POST', `/documentos-recibidos/${encodeURIComponent(String(id))}/reject`, { reason: motivo }, idempotencyKey);
  }

  certificado() { return this.json('GET', '/certificates/info'); }

  // ── transporte ────────────────────────────────────────────────────────────
  private url(ruta: string) { return `${this.baseUrl}/${this.ambiente}${ruta}`; }

  private async pedir(metodo: string, ruta: string, cuerpo?: unknown, idempotencyKey?: string): Promise<Response> {
    const headers: Record<string, string> = { 'X-API-Key': this.apiKey, Accept: 'application/json' };
    if (cuerpo !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
    try {
      return await fetch(this.url(ruta), {
        method: metodo,
        headers,
        body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
        signal: ctrl.signal,
      });
    } catch (e) {
      throw new FrandeEcfError(`Sin conexión con Frande ECF: ${(e as Error).message}`, 0);
    } finally {
      clearTimeout(t);
    }
  }

  private async json<T = any>(metodo: string, ruta: string, cuerpo?: unknown, idempotencyKey?: string): Promise<Respuesta<T>> {
    const r = await this.pedir(metodo, ruta, cuerpo, idempotencyKey);
    let body: any = null;
    try { body = await r.json(); } catch { /* respuesta sin JSON */ }
    if (!r.ok || body?.success === false) {
      throw new FrandeEcfError(body?.error?.message ?? `HTTP ${r.status}`, r.status, body?.error?.code, body?.requestId, body);
    }
    return body as Respuesta<T>;
  }

  private async binario(ruta: string): Promise<Uint8Array> {
    const r = await this.pedir('GET', ruta);
    if (!r.ok) {
      let body: any = null;
      try { body = await r.json(); } catch { /* */ }
      throw new FrandeEcfError(body?.error?.message ?? `HTTP ${r.status}`, r.status, body?.error?.code, body?.requestId, body);
    }
    return new Uint8Array(await r.arrayBuffer());
  }
}

/**
 * Verifica un webhook de Frande ECF.
 * Firma: `sha256=` + HMAC-SHA256 hex de `${timestamp}.${nonce}.${cuerpoCrudo}` con el secreto del destino.
 * Pasa el cuerpo CRUDO (tal como llegó, sin parsear). Rechaza timestamps de más de 5 minutos.
 * Guarda los nonces vistos (por ejemplo 10 minutos) y rechaza los repetidos: `nonceYaVisto`.
 */
export function verificarWebhook(opciones: {
  secreto: string;
  cuerpoCrudo: string | Buffer;
  firma?: string | null;
  timestamp?: string | null;
  nonce?: string | null;
  toleranciaSegundos?: number;
  ahora?: number;
  nonceYaVisto?: (nonce: string) => boolean;
}): boolean {
  const { secreto, cuerpoCrudo, firma, timestamp, nonce } = opciones;
  if (!secreto || !firma || !timestamp || !nonce) return false;
  const ts = Number(timestamp);
  const ahora = opciones.ahora ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(ts) || Math.abs(ahora - ts) > (opciones.toleranciaSegundos ?? 300)) return false;
  if (opciones.nonceYaVisto?.(nonce)) return false;
  const cuerpo = typeof cuerpoCrudo === 'string' ? cuerpoCrudo : cuerpoCrudo.toString('utf8');
  const esperado = 'sha256=' + createHmac('sha256', secreto).update(`${timestamp}.${nonce}.${cuerpo}`, 'utf8').digest('hex');
  const a = Buffer.from(esperado);
  const b = Buffer.from(firma);
  return a.length === b.length && timingSafeEqual(a, b);
}

export default FrandeEcf;
