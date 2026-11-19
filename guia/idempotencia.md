<!-- Generado desde https://ecf.frandeone.com/developers/docs/idempotencia.html · no editar a mano: se regenera desde el ECF -->


# Idempotencia y reintentos

_Si tu sistema no recibió la respuesta (corte, tiempo agotado), repite la misma petición con la misma clave: recibes el resultado original, sin duplicar._

## La cabecera Idempotency-Key

- Valor de **8 a 128 caracteres** entre `A-Z a-z 0-9 _ - : . =`, único por operación. Por ejemplo `venta-1042-emitir`.
- Se recuerda por cuenta y operación durante **24 horas**.
- Misma clave y **mismo cuerpo**: recibes la respuesta guardada, con el encabezado `Idempotent-Replayed: true`, y no se duplica nada.
- Misma clave con **otro cuerpo**: 409 `IDEMPOTENCY_KEY_CONFLICT`.
- La primera petición todavía está en curso: 409 `IDEMPOTENCY_IN_FLIGHT`. Espera unos segundos y repite.
- Las respuestas pasajeras (5xx, 408, 429) no se guardan: el reintento entra como nuevo.

## Cuándo es obligatoria

Con una credencial `foecf_*` (pruebas o producción), la cabecera es **obligatoria** en estas operaciones; sin ella recibes 400 `IDEMPOTENCY_KEY_REQUIRED`:

| Operación | Ruta |
|---|---|
| Emitir | `POST /v1/{env}/documentos-ecf` (con `?validate=true` no hace falta) |
| Anular números (ANECF) | `POST /v1/{env}/anulacion-ecf` |
| Aprobación comercial | `POST /v1/{env}/aprobacion-comercial` |
| Aprobar un recibido | `POST /v1/{env}/documentos-recibidos/{id}/approve` |
| Rechazar un recibido | `POST /v1/{env}/documentos-recibidos/{id}/reject` |

Con un formato inválido recibes 400 `INVALID_IDEMPOTENCY_KEY`. Las consultas (GET) no la usan.

## Cómo construir la clave

- Que dependa de **la operación de negocio**, no del intento: `venta-1042-emitir`, no un número aleatorio nuevo en cada reintento.
- Guárdala junto con la venta antes de enviar, para reusarla si hay que reintentar.
- Una clave por operación: la nota de crédito de esa venta es otra operación (`venta-1042-nota-credito`).

## Tres protecciones contra duplicados

| Protección | Qué evita | Quién la activa |
|---|---|---|
| `Idempotency-Key` | Repetir la misma petición por un corte de red | Tu sistema envía la cabecera |
| El `eNCF` | Dos documentos con el mismo número (mismo contenido: devuelve el original) | Automática |
| `referencia_externa` | Emitir dos veces la misma venta aunque cambie el número | Tu sistema envía el campo |

## Reintentos recomendados

Reintenta con la **misma clave** ante cualquier 5xx, tiempo agotado o respuesta que no sea JSON (a veces un intermediario devuelve una página de error), y ante 429 espera los segundos de `Retry-After`. No reintentes un 4xx: hay que corregir algo. Los códigos reintentables están marcados en el [catálogo de errores](errores.md).

```javascript
async function emitirConReintentos(documento, clave, intentos = 4) {
  for (let i = 1; i <= intentos; i++) {
    try {
      const r = await fetch('https://ecf.frandeone.com/v1/TesteCF/documentos-ecf', {
        method: 'POST',
        headers: { 'X-API-Key': process.env.ECF_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': clave },
        body: JSON.stringify(documento),
      });
      if (r.status < 500 && r.status !== 429) return { status: r.status, cuerpo: await r.json() };
      const espera = Number(r.headers.get('retry-after')) || 2 ** i;
      await new Promise((ok) => setTimeout(ok, espera * 1000));
    } catch (e) {
      await new Promise((ok) => setTimeout(ok, 2 ** i * 1000));   // corte de red: misma clave
    }
  }
  throw new Error('Sin respuesta; consulta por referencia_externa antes de emitir de nuevo');
}
```

> ✓

Si agotaste los reintentos sin respuesta, **consulta antes de emitir de nuevo**: busca el documento por tu `referencia_externa` o por su e-NCF. Puede haberse emitido aunque no te llegara la respuesta.
