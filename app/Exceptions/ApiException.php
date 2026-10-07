<?php

namespace App\Exceptions;

use Exception;

/**
 * Erro de regra de negócio no formato { "erro": { "codigo", "mensagem", "campos" } }.
 */
class ApiException extends Exception
{
    public function __construct(
        public readonly string $codigo,
        string $mensagem,
        public readonly int $status = 400,
        public readonly array $campos = [],
        public readonly array $extras = [],
    ) {
        parent::__construct($mensagem, $status);
    }

    public static function conflito(string $codigo, string $mensagem, array $campos = [], array $extras = []): self
    {
        return new self($codigo, $mensagem, 409, $campos, $extras);
    }

    public static function validacao(string $mensagem, array $campos = []): self
    {
        return new self('VALIDACAO', $mensagem, 422, $campos);
    }

    public static function semPermissao(string $mensagem = 'Você não tem permissão para realizar esta ação.'): self
    {
        return new self('SEM_PERMISSAO', $mensagem, 403);
    }

    public function corpo(): array
    {
        $erro = ['codigo' => $this->codigo, 'mensagem' => $this->getMessage()];

        if ($this->campos !== []) {
            $erro['campos'] = $this->campos;
        }

        return ['erro' => array_merge($erro, $this->extras)];
    }
}
