<?php

namespace App\Repositories;

use App\Models\Projeto;
use App\Models\User;
use App\Support\Paginacao;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProjetoRepository
{
    private const ORDENAVEIS = ['nome', 'status', 'fim', 'progresso'];

    private const PROGRESSO_SQL = 'coalesce((select count(*) from tarefas where tarefas.projeto_id = projetos.id and tarefas.status = \'concluida\') * 1.0'
        .' / nullif((select count(*) from tarefas where tarefas.projeto_id = projetos.id), 0), 0)';

    /** Escopo: diretor vê todos; os demais, apenas os projetos de que são membros. */
    public function visiveis(User $usuario): Builder
    {
        $consulta = Projeto::query();

        if ($usuario->temPermissao('projetos.ver_todos')) {
            return $consulta;
        }

        return $consulta->whereHas('membros', fn ($m) => $m->where('users.id', $usuario->id));
    }

    private function completo(Builder $consulta): Builder
    {
        return $consulta->with('membros')->withCount([
            'tarefas',
            'tarefas as tarefas_concluidas_count' => fn ($q) => $q->where('status', 'concluida'),
        ]);
    }

    public function paginar(User $usuario, array $filtros): LengthAwarePaginator
    {
        $consulta = $this->completo($this->visiveis($usuario));

        if (! empty($filtros['q'])) {
            $termo = '%'.$filtros['q'].'%';
            $consulta->where(fn ($w) => $w->where('nome', 'like', $termo)->orWhere('descricao', 'like', $termo));
        }

        if (! empty($filtros['status'])) {
            $consulta->where('status', $filtros['status']);
        }

        $coluna = in_array($filtros['ordenar'] ?? null, self::ORDENAVEIS, true) ? $filtros['ordenar'] : 'nome';
        $direcao = strtolower($filtros['direcao'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        if ($coluna === 'progresso') {
            $consulta->orderByRaw(self::PROGRESSO_SQL.' '.$direcao);
        } else {
            $consulta->orderBy($coluna, $direcao);
        }

        return $consulta->orderBy('id')->paginate(
            Paginacao::limite($filtros['limite'] ?? null),
            ['*'],
            'page',
            Paginacao::pagina($filtros['pagina'] ?? null)
        );
    }

    public function encontrarVisivel(User $usuario, int $id): Projeto
    {
        return $this->completo($this->visiveis($usuario))->findOrFail($id);
    }

    public function recarregar(int $id): Projeto
    {
        return $this->completo(Projeto::query())->findOrFail($id);
    }

    public function criar(array $dados, array $membros): Projeto
    {
        return DB::transaction(function () use ($dados, $membros) {
            $projeto = Projeto::create($dados + ['status' => Projeto::EM_EXECUCAO]);
            $projeto->membros()->sync($membros);

            return $projeto;
        });
    }

    public function atualizar(Projeto $projeto, array $dados, array $membros): Projeto
    {
        return DB::transaction(function () use ($projeto, $dados, $membros) {
            $projeto->update($dados);
            $projeto->membros()->sync($membros);

            return $projeto;
        });
    }

    public function definirStatus(Projeto $projeto, string $status): Projeto
    {
        $projeto->update(['status' => $status]);

        return $projeto;
    }

    public function excluir(Projeto $projeto): void
    {
        DB::transaction(function () use ($projeto) {
            $projeto->tarefas()->delete();
            $projeto->membros()->detach();
            $projeto->delete();
        });
    }

    public function idsDosMembros(Projeto $projeto): array
    {
        return $projeto->membros()->pluck('users.id')->map(fn ($id) => (int) $id)->all();
    }

    public function idsDosMembrosAtivos(Projeto $projeto): array
    {
        return $projeto->membros()->where('users.ativo', true)->pluck('users.id')->map(fn ($id) => (int) $id)->all();
    }

    public function contarEmExecucao(User $usuario, ?int $projetoId = null): int
    {
        return $this->visiveis($usuario)
            ->where('status', Projeto::EM_EXECUCAO)
            ->when($projetoId, fn ($q) => $q->where('projetos.id', $projetoId))
            ->count();
    }

    /** Projetos do escopo do usuário com todas as tarefas carregadas (progresso e atrasos). */
    public function visiveisComTarefas(User $usuario, ?string $status): \Illuminate\Database\Eloquent\Collection
    {
        return $this->visiveis($usuario)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->with('tarefas')
            ->orderBy('nome')
            ->orderBy('id')
            ->get();
    }
}
