<?php
declare(strict_types=1);

namespace Frande\Ecf;

/**
 * Verificación de webhooks de Frande ECF.
 * Firma: 'sha256=' + HMAC-SHA256 hex de "{timestamp}.{nonce}.{cuerpoCrudo}" con el secreto del destino.
 */
final class Webhook
{
    /**
     * @param string        $cuerpoCrudo  el cuerpo tal como llegó: file_get_contents('php://input')
     * @param callable|null $nonceYaVisto fn(string $nonce): bool — guarda los nonces ~10 min y rechaza repetidos
     */
    public static function verificar(
        string $secreto,
        string $cuerpoCrudo,
        ?string $firma,
        ?string $timestamp,
        ?string $nonce,
        int $toleranciaSegundos = 300,
        ?callable $nonceYaVisto = null,
        ?int $ahora = null,
    ): bool {
        if ($secreto === '' || !$firma || !$timestamp || !$nonce || !ctype_digit($timestamp)) {
            return false;
        }
        if (abs(($ahora ?? time()) - (int)$timestamp) > $toleranciaSegundos) {
            return false;
        }
        if ($nonceYaVisto !== null && $nonceYaVisto($nonce)) {
            return false;
        }
        $esperado = 'sha256=' . hash_hmac('sha256', $timestamp . '.' . $nonce . '.' . $cuerpoCrudo, $secreto);
        return hash_equals($esperado, $firma);
    }

    /** Lee y verifica la petición actual. Devuelve [evento, datos] o null si la firma no es válida. */
    public static function desdePeticion(string $secreto, ?callable $nonceYaVisto = null): ?array
    {
        $cuerpo = (string)file_get_contents('php://input');
        $ok = self::verificar(
            $secreto,
            $cuerpo,
            $_SERVER['HTTP_X_ECF_SIGNATURE'] ?? null,
            $_SERVER['HTTP_X_ECF_TIMESTAMP'] ?? null,
            $_SERVER['HTTP_X_ECF_NONCE'] ?? null,
            300,
            $nonceYaVisto,
        );
        if (!$ok) {
            return null;
        }
        return [$_SERVER['HTTP_X_ECF_EVENT'] ?? '', json_decode($cuerpo, true)];
    }
}
