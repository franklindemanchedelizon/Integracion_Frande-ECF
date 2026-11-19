# SDK PHP de Frande ECF

PHP 8.1+ con `curl` y `json`, sin dependencias.

```bash
composer require frande/ecf-sdk   # cuando se publique; mientras tanto, copia src/ y usa su autoload PSR-4
```

```php
use Frande\Ecf\Client;
use Frande\Ecf\FrandeEcfException;
use Frande\Ecf\Webhook;

$ecf = new Client(getenv('FRANDE_ECF_KEY'), 'TesteCF');

$ecf->cuenta();                                        // probar la conexión (no emite)

try {
    $r = $ecf->emitir($payload, 'venta-' . $venta['id']);
    echo $r['data']['ecf'], ' ', $r['data']['securityCode'];
} catch (FrandeEcfException $e) {
    if ($e->reintentable()) {
        // reintenta más tarde con LA MISMA clave de idempotencia: no se emite dos veces
    } else {
        error_log($e->codigo . ' ' . $e->getMessage() . ' requestId=' . $e->requestId);
    }
}

file_put_contents('factura.pdf', $ecf->pdf($internalTrackId));
```

Webhook:

```php
$evento = Webhook::desdePeticion(getenv('FRANDE_ECF_WEBHOOK_SECRET'), fn ($n) => nonce_visto($n));
if ($evento === null) { http_response_code(401); exit; }
http_response_code(200);                               // responde rápido, procesa después
[$tipo, $datos] = $evento;
```
