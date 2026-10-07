<?php

namespace App\Repositories;

use App\Models\Projeto;
use App\Models\Tarefa;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class TarefaRepository
{
    /**
     * Escopo de tarefas:
     *  - diretor: todas;
     *  - gerente: as dos projetos de que é membro;
     *  - membro: somente aquelas em que é responsável.
     */
    public function visiveis(User $usuario): Builder
    {
        $consulta = Tarefa::query();

        if ($usuario->temPermissao('tarefas.ver_todas')) {
            return $consulta;
        }

        if ($usuario->temPermissao('tarefas.ver_do_projeto')) {
            return $consulta->whereHas('projeto.membros', fn ($m) => $m->where('users.id', $usuario->id));
        }

        return $consulta->whereHas('responsaveis', fn ($r) => $r->where('users.id', $usuario->id));
    }

    public function encontrarVisivel(User $usuario, int $id): Tarefa
    {
        return $this->visiveis($usuario)->with('responsaveis')->findOrFail($id);
    }

    public function doProjeto(User $usuario, Projeto $projeto, array $filtros): Collection
    {
        $consulta = $this->visiveis($usuario)
            ->where('projeto_id', $projeto->id)
            ->with('responsaveis');

        if (! empty($filtros['status'])) {
            $consulta->where('status', $filtros['status']);
        }

        if (! empty($filtros['prioridade'])) {
            $consulta->where('prioridade', $filtros['prioridade']);
        }

        if (! empty($filtros['responsavel'])) {
            $consulta->whereHas('responsaveis', fn ($r) => $r->where('users.id', (int) $filtros['responsavel']));
        }

        return $consulta->orderBy('prioridade')->orderBy('fim')->orderBy('id')->get();
    }

    public function criar(Projeto $projeto, array $dados, array $responsaveis): Tarefa
    {
        $tarefa = Tarefa::create($dados + ['projeto_id' => $projeto->id, 'status' => Tarefa::PENDENTE]);
        $tarefa->responsaveis()->sync($responsaveis);

        return $this->recarregar($tarefa->id);
    }

    public function atualizar(Tarefa $tarefa, array $dados, ?array $responsaveis = null): Tarefa
    {
        $tarefa->update($dados);

        if ($responsaveis !== null) {
            $tarefa->responsaveis()->sync($responsaveis);
        }

        return $this->recarregar($tarefa->id);
    }

    public function excluir(Tarefa $tarefa): void
    {
        $tarefa->responsaveis()->detach();
        $tarefa->delete();
    }

    public function recarregar(int $id): Tarefa
    {
        return Tarefa::with('responsaveis')->findOrFail($id);
    }

    /** Tarefas em que o usuário é responsável (card "Minhas tarefas"). */
    public function minhas(User $usuario, bool $somenteAbertas, int $limite): Collection
    {
        return Tarefa::query()
            ->whereHas('responsaveis', fn ($r) => $r->where('users.id', $usuario->id))
            ->when($somenteAbertas, fn ($q) => $q->where('status', '!=', Tarefa::CONCLUIDA))
            ->with(['responsaveis', 'projeto'])
            ->orderBy('fim')
            ->orderBy('id')
            ->limit($limite)
            ->get();
    }

    /** Tarefas abertas do projeto atribuídas a qualquer um dos usuários informados. */
    public function abertasDosUsuarios(Projeto $projeto, array $usuarioIds): Collection
    {
        return Tarefa::query()
            ->where('projeto_id', $projeto->id)
            ->where('status', '!=', Tarefa::CONCLUIDA)
            ->whereHas('responsaveis', fn ($r) => $r->whereIn('users.id', $usuarioIds))
            ->with(['responsaveis' => fn ($r) => $r->whereIn('users.id', $usuarioIds)])
            ->orderBy('id')
            ->get();
    }

    /** Tarefas dentro do escopo do usuário, para dashboard e burndown. */
    public function paraDashboard(User $usuario, ?int $projetoId): Collection
    {
        return $this->visiveis($usuario)
            ->when($projetoId, fn ($q) => $q->where('projeto_id', $projetoId))
            ->get();
    }

    /** Tarefas dentro do escopo do usuário para a eficiência (período é pelo fim da tarefa). */
    public function paraEficiencia(User $usuario, array $filtros): Collection
    {
        return $this->visiveis($usuario)
            ->when(! empty($filtros['projetoId']), fn ($q) => $q->where('projeto_id', (int) $filtros['projetoId']))
            ->when(! empty($filtros['de']), fn ($q) => $q->where('fim', '>=', $filtros['de']))
            ->when(! empty($filtros['ate']), fn ($q) => $q->where('fim', '<=', $filtros['ate']))
            ->with(['responsaveis', 'projeto'])
            ->get();
    }
}
