<?php
declare(strict_types=1);

namespace Frande\Ecf;

/**
 * SDK PHP de Frande ECF (PHP 8.1+, ext-curl, ext-json).
 * Contrato: openapi/frande-ecf-v1.openapi.json · API: https://ecf.frandeone.com/v1
 */
final class Client
{
    private string $baseUrl;

    /**
     * @param string $apiKey   foecf_test_... (TesteCF) o foecf_live_... (eCF)
     * @param string $ambiente 'TesteCF' o 'eCF'
     */
    public function __construct(
        private readonly string $apiKey,
        private readonly string $ambiente = 'TesteCF',
        string $baseUrl = 'https://ecf.frandeone.com/v1',
        private readonly int $timeout = 30,
    ) {
        if ($apiKey === '') {
            throw new \InvalidArgumentException('Falta apiKey');
        }
        $this->baseUrl = rtrim($baseUrl, '/');
    }

    /** Probar la conexión: RNC, ambiente efectivo y estado del certificado. No emite. */
    public function cuenta(): array { return $this->json('GET', '/cuenta'); }

    /** Progreso de los casos de prueba de integración (solo credencial de pruebas). */
    public function pruebasIntegracion(): array { return $this->json('GET', '/pruebas-integracion'); }

    /**
     * Emitir un e-CF. $idempotencyKey: único por venta (8 a 128 caracteres).
     * Con $soloValidar no se envía a la DGII ni se gasta la secuencia.
     */
    public function emitir(array $payload, string $idempotencyKey, bool $soloValidar = false): array
    {
        return $this->json('POST', '/documentos-ecf' . ($soloValidar ? '?validate=true' : ''), $payload, $idempotencyKey);
    }

    public function porEncf(string $encf): array { return $this->json('GET', '/documentos-ecf/por-encf/' . rawurlencode($encf)); }
    public function porReferencia(string $ref): array { return $this->json('GET', '/documentos-ecf/por-referencia/' . rawurlencode($ref)); }
    public function documento(string $internalTrackId): array { return $this->json('GET', '/documentos-ecf/' . rawurlencode($internalTrackId)); }

    /** Estado en vivo ante la DGII. */
    public function estado(string $internalTrackId): array { return $this->json('GET', '/documentos-ecf/' . rawurlencode($internalTrackId) . '/status'); }

    /** @param string[] $internalTrackIds */
    public function estadoVarios(array $internalTrackIds): array
    {
        return $this->json('POST', '/documentos-ecf/batch-status', ['internalTrackIds' => array_values($internalTrackIds)]);
    }

    public function listar(array $params = []): array
    {
        return $this->json('GET', '/documentos-ecf' . ($params ? '?' . http_build_query($params) : ''));
    }

    /** Representación impresa (PDF) en bytes. */
    public function pdf(string $internalTrackId): string { return $this->binario('/documentos-ecf/' . rawurlencode($internalTrackId) . '/pdf'); }

    /** XML firmado. */
    public function xml(string $internalTrackId): string { return $this->binario('/documentos-ecf/' . rawurlencode($internalTrackId) . '/xml'); }

    /**
     * Anular secuencias no usadas (ANECF).
     * @param array<int, array{desde: string, hasta: string}> $rangos
     */
    public function anular(array $rangos, string $idempotencyKey): array
    {
        return $this->json('POST', '/anulacion-ecf', ['rangos' => $rangos], $idempotencyKey);
    }

    /** Directorio DGII: si el comprador recibe e-CF electrónicamente. */
    public function directorio(string $rnc): array { return $this->json('GET', '/directorio/' . rawurlencode($rnc)); }

    public function recibidos(array $params = []): array
    {
        return $this->json('GET', '/documentos-recibidos' . ($params ? '?' . http_build_query($params) : ''));
    }

    /** Aprobación comercial (ACECF) de un e-CF recibido. */
    public function aprobarRecibido(string|int $id, string $idempotencyKey): array
    {
        return $this->json('POST', '/documentos-recibidos/' . rawurlencode((string)$id) . '/approve', [], $idempotencyKey);
    }

    /** Rechazo comercial (ACECF) de un e-CF recibido, con su motivo. */
    public function rechazarRecibido(string|int $id, string $motivo, string $idempotencyKey): array
    {
        return $this->json('POST', '/documentos-recibidos/' . rawurlencode((string)$id) . '/reject', ['reason' => $motivo], $idempotencyKey);
    }

    public function certificado(): array { return $this->json('GET', '/certificates/info'); }

    // ── transporte ──────────────────────────────────────────────────────────

    /** @return array{0:int,1:string} */
    private function pedir(string $metodo, string $ruta, ?array $cuerpo = null, ?string $idempotencyKey = null): array
    {
        $headers = ['X-API-Key: ' . $this->apiKey, 'Accept: application/json'];
        if ($cuerpo !== null) {
            $headers[] = 'Content-Type: application/json';
        }
        if ($idempotencyKey !== null && $idempotencyKey !== '') {
            $headers[] = 'Idempotency-Key: ' . $idempotencyKey;
        }
        $ch = curl_init($this->baseUrl . '/' . $this->ambiente . $ruta);
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $metodo,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);
        if ($cuerpo !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($cuerpo, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        }
        $raw = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        $err = curl_error($ch);
        curl_close($ch);
        if ($raw === false) {
            throw new FrandeEcfException('Sin conexión con Frande ECF: ' . $err, 0);
        }
        return [$status, (string)$raw];
    }

    private function json(string $metodo, string $ruta, ?array $cuerpo = null, ?string $idempotencyKey = null): array
    {
        [$status, $raw] = $this->pedir($metodo, $ruta, $cuerpo, $idempotencyKey);
        $body = json_decode($raw, true);
        if ($status < 200 || $status >= 300 || !is_array($body) || ($body['success'] ?? true) === false) {
            throw FrandeEcfException::desdeRespuesta($status, is_array($body) ? $body : null);
        }
        return $body;
    }

    private function binario(string $ruta): string
    {
        [$status, $raw] = $this->pedir('GET', $ruta);
        if ($status < 200 || $status >= 300) {
            $body = json_decode($raw, true);
            throw FrandeEcfException::desdeRespuesta($status, is_array($body) ? $body : null);
        }
        return $raw;
    }
}
