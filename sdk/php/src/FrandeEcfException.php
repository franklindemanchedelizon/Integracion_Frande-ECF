<?php
declare(strict_types=1);

namespace Frande\Ecf;

/** Error de la API con su código (ECF_VALIDATION_FAILED, IDEMPOTENCY_KEY_CONFLICT, ...) y el requestId para soporte. */
final class FrandeEcfException extends \RuntimeException
{
    public function __construct(
        string $message,
        public readonly int $status,
        public readonly ?string $codigo = null,
        public readonly ?string $requestId = null,
        public readonly ?array $cuerpo = null,
    ) {
        parent::__construct($message, $status);
    }

    public static function desdeRespuesta(int $status, ?array $body): self
    {
        return new self(
            (string)($body['error']['message'] ?? ('HTTP ' . $status)),
            $status,
            isset($body['error']['code']) ? (string)$body['error']['code'] : null,
            isset($body['requestId']) ? (string)$body['requestId'] : null,
            $body,
        );
    }

    /** 5xx, 408, 429 o sin conexión: se puede reintentar con la misma Idempotency-Key. */
    public function reintentable(): bool
    {
        return $this->status === 0 || $this->status >= 500 || $this->status === 408 || $this->status === 429;
    }
}
