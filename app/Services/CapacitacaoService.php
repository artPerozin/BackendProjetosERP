<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Capacitacao;
use App\Models\User;
use App\Repositories\CapacitacaoRepository;
use App\Repositories\UsuarioRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class CapacitacaoService
{
    public function __construct(
        private readonly CapacitacaoRepository $capacitacoes,
        private readonly UsuarioRepository $usuarios,
    ) {
    }

    public function calendario(array $filtros): Collection
    {
        return $this->capacitacoes->calendario($filtros);
    }

    public function detalhar(int $id): Capacitacao
    {
        return $this->capacitacoes->encontrarOuFalhar($id);
    }

    public function criar(array $dados): Capacitacao
    {
        return $this->capacitacoes->criar($dados);
    }

    public function atualizar(int $id, array $dados): Capacitacao
    {
        $capacitacao = $this->capacitacoes->encontrarOuFalhar($id);

        if ($dados['vagas'] < $capacitacao->inscritos->count()) {
            throw ApiException::conflito(
                'VAGAS_INSUFICIENTES',
                'O número de vagas não pode ser menor que o de inscritos.',
                ['vagas' => 'menor que o número de inscritos']
            );
        }

        return $this->capacitacoes->atualizar($capacitacao, $dados);
    }

    public function excluir(int $id): void
    {
        $this->capacitacoes->excluir($this->capacitacoes->encontrarOuFalhar($id));
    }

    public function inscrever(User $ator, int $id, ?int $usuarioId): Capacitacao
    {
        $alvo = $this->resolverAlvo($ator, $usuarioId);

        DB::transaction(function () use ($id, $alvo) {
            $capacitacao = $this->capacitacoes->travarOuFalhar($id);

            if ($capacitacao->jaOcorreu()) {
                throw ApiException::conflito('CAPACITACAO_ENCERRADA', 'Esta capacitação já ocorreu.');
            }

            if ($this->capacitacoes->estaInscrito($capacitacao, $alvo->id)) {
                throw ApiException::conflito('JA_INSCRITO', 'Usuário já inscrito nesta capacitação.');
            }

            if ($this->capacitacoes->totalInscritos($capacitacao) >= $capacitacao->vagas) {
                throw ApiException::conflito('SEM_VAGAS', 'Não há vagas disponíveis.');
            }

            $this->capacitacoes->inscrever($capacitacao, $alvo->id);
        });

        return $this->capacitacoes->encontrarOuFalhar($id);
    }

    /** $usuarioId = null significa o usuário logado (rota usa "me"). */
    public function cancelar(User $ator, int $id, ?int $usuarioId): Capacitacao
    {
        $alvoId = $usuarioId ?? $ator->id;

        if ($alvoId !== $ator->id && ! $ator->temPermissao('capacitacoes.inscrever_outros')) {
            throw ApiException::semPermissao();
        }

        DB::transaction(function () use ($id, $alvoId) {
            $capacitacao = $this->capacitacoes->travarOuFalhar($id);

            if (! $this->capacitacoes->estaInscrito($capacitacao, $alvoId)) {
                throw new ApiException('NAO_ENCONTRADO', 'Inscrição não encontrada.', 404);
            }

            if ($capacitacao->jaOcorreu()) {
                throw ApiException::conflito('CAPACITACAO_ENCERRADA', 'Esta capacitação já ocorreu.');
            }

            $this->capacitacoes->cancelar($capacitacao, $alvoId);
        });

        return $this->capacitacoes->encontrarOuFalhar($id);
    }

    public function minhas(User $ator, array $filtros): Collection
    {
        $futuras = filter_var($filtros['futuras'] ?? true, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? true;
        $limite = max(1, min(100, (int) ($filtros['limite'] ?? 6)));

        return $this->capacitacoes->minhas($ator, $futuras, $limite);
    }

    /** Inscrever outra pessoa: somente diretor ou gerente; o alvo precisa estar ativo. */
    private function resolverAlvo(User $ator, ?int $usuarioId): User
    {
        if ($usuarioId === null || $usuarioId === $ator->id) {
            return $ator;
        }

        if (! $ator->temPermissao('capacitacoes.inscrever_outros')) {
            throw ApiException::semPermissao('Você só pode inscrever a si mesmo.');
        }

        $alvo = $this->usuarios->encontrarOuFalhar($usuarioId);

        if (! $alvo->ativo) {
            throw ApiException::validacao('Dados inválidos.', ['usuarioId' => 'usuário inativo']);
        }

        return $alvo;
    }
}
