<?php
// Pruebas del SDK PHP sin red ni dependencias: php sdk/php/tests/run.php
declare(strict_types=1);
require __DIR__ . '/../src/FrandeEcfException.php';
require __DIR__ . '/../src/Webhook.php';
require __DIR__ . '/../src/Client.php';

use Frande\Ecf\{Client, FrandeEcfException, Webhook};

$fallos = 0;
function comprobar(string $nombre, bool $ok): void
{
    global $fallos;
    echo ($ok ? '✔ ' : '✖ ') . $nombre . PHP_EOL;
    if (!$ok) { $fallos++; }
}

$secreto = 's3cr3t';
$cuerpo = '{"event":"ecf.accepted"}';
$ts = (string)time();
$nonce = bin2hex(random_bytes(16));
$firma = 'sha256=' . hash_hmac('sha256', "$ts.$nonce.$cuerpo", $secreto);

comprobar('webhook: firma válida', Webhook::verificar($secreto, $cuerpo, $firma, $ts, $nonce));
comprobar('webhook: cuerpo alterado', !Webhook::verificar($secreto, $cuerpo . ' ', $firma, $ts, $nonce));
comprobar('webhook: firma vieja (más de 5 min)', !Webhook::verificar($secreto, $cuerpo, $firma, $ts, $nonce, 300, null, (int)$ts + 400));
comprobar('webhook: nonce repetido', !Webhook::verificar($secreto, $cuerpo, $firma, $ts, $nonce, 300, fn ($n) => true));
comprobar('webhook: sin firma', !Webhook::verificar($secreto, $cuerpo, null, $ts, $nonce));

$e = FrandeEcfException::desdeRespuesta(400, ['success' => false, 'error' => ['code' => 'ECF_VALIDATION_FAILED', 'message' => 'mal'], 'requestId' => 'r1']);
comprobar('error: código y requestId', $e->codigo === 'ECF_VALIDATION_FAILED' && $e->requestId === 'r1' && $e->status === 400);
comprobar('error 400 no se reintenta', !$e->reintentable());
comprobar('error 503 se reintenta', FrandeEcfException::desdeRespuesta(503, null)->reintentable());
comprobar('sin conexión se reintenta', (new FrandeEcfException('x', 0))->reintentable());

try { new Client(''); comprobar('cliente sin credencial falla', false); }
catch (\InvalidArgumentException) { comprobar('cliente sin credencial falla', true); }

echo PHP_EOL . ($fallos === 0 ? 'Todo bien.' : "$fallos con falla.") . PHP_EOL;
exit($fallos === 0 ? 0 : 1);
