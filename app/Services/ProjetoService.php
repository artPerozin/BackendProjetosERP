<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Projeto;
use App\Models\User;
use App\Repositories\ProjetoRepository;
use App\Repositories\TarefaRepository;
use App\Repositories\UsuarioRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

class ProjetoService
{
    public function __construct(
        private readonly ProjetoRepository $projetos,
        private readonly TarefaRepository $tarefas,
        private readonly UsuarioRepository $usuarios,
    ) {
    }

    public function listar(User $ator, array $filtros): LengthAwarePaginator
    {
        return $this->projetos->paginar($ator, $filtros);
    }

    public function detalhar(User $ator, int $id): Projeto
    {
        return $this->projetos->encontrarVisivel($ator, $id);
    }

    public function criar(User $ator, array $dados): Projeto
    {
        $membros = $this->membrosFinais($ator, $dados['membros'] ?? [], []);

        $projeto = $this->projetos->criar(Arr::except($dados, ['membros']), $membros);

        return $this->projetos->recarregar($projeto->id);
    }

    public function atualizar(User $ator, int $id, array $dados): Projeto
    {
        $projeto = $this->projetos->encontrarVisivel($ator, $id);

        $atuais = $this->projetos->idsDosMembros($projeto);
        $membros = $this->membrosFinais($ator, $dados['membros'] ?? [], $atuais);

        $this->garantirRemocaoPermitida($projeto, array_values(array_diff($atuais, $membros)));

        $this->projetos->atualizar($projeto, Arr::except($dados, ['membros']), $membros);

        return $this->projetos->recarregar($projeto->id);
    }

    public function alterarStatus(User $ator, int $id, string $status): Projeto
    {
        $projeto = $this->projetos->encontrarVisivel($ator, $id);

        $this->projetos->definirStatus($projeto, $status);

        return $this->projetos->recarregar($projeto->id);
    }

    public function excluir(User $ator, int $id): void
    {
        $projeto = $this->projetos->encontrarVisivel($ator, $id);

        $this->projetos->excluir($projeto);
    }

    /**
     * Novos membros precisam estar ativos (quem já era membro pode permanecer).
     * Quem não é diretor e salva o projeto continua sendo membro dele ("os seus" projetos).
     */
    private function membrosFinais(User $ator, array $solicitados, array $atuais): array
    {
        $ids = array_values(array_unique(array_map('intval', $solicitados)));

        $novos = array_values(array_diff($ids, $atuais));
        if ($novos !== []) {
            $ativos = $this->usuarios->ativosPorIds($novos)->pluck('id')->all();
            if (array_diff($novos, $ativos) !== []) {
                throw ApiException::validacao('Dados inválidos.', ['membros' => 'todos os membros devem ser usuários ativos']);
            }
        }

        if (! $ator->temPermissao('projetos.ver_todos') && ! in_array($ator->id, $ids, true)) {
            $ids[] = $ator->id;
        }

        return $ids;
    }

    private function garantirRemocaoPermitida(Projeto $projeto, array $removidos): void
    {
        if ($removidos === []) {
            return;
        }

        $abertas = $this->tarefas->abertasDosUsuarios($projeto, $removidos);

        if ($abertas->isEmpty()) {
            return;
        }

        throw ApiException::conflito(
            'MEMBRO_COM_TAREFAS_ABERTAS',
            'Há tarefas abertas atribuídas a membros removidos. Reatribua as tarefas antes de remover.',
            [],
            ['tarefas' => $abertas->map(fn ($t) => [
                'id' => $t->id,
                'titulo' => $t->titulo,
                'responsaveis' => $t->responsaveis->map(fn ($u) => ['id' => $u->id, 'nome' => $u->nome])->values()->all(),
            ])->values()->all()]
        );
    }
}
