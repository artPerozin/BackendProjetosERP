<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\Projeto;
use App\Models\Tarefa;
use App\Models\User;
use App\Repositories\ProjetoRepository;
use App\Repositories\TarefaRepository;
use App\Support\Data;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Arr;

class TarefaService
{
    public function __construct(
        private readonly TarefaRepository $tarefas,
        private readonly ProjetoRepository $projetos,
    ) {
    }

    /** Tarefas do projeto dentro do escopo do usuário + período para o eixo do Gantt. */
    public function listarDoProjeto(User $ator, int $projetoId, array $filtros): array
    {
        $projeto = $this->projetos->encontrarVisivel($ator, $projetoId);
        $tarefas = $this->tarefas->doProjeto($ator, $projeto, $filtros);

        $periodo = $tarefas->isEmpty() ? null : [
            'inicio' => $tarefas->min(fn ($t) => $t->inicio->toDateString()),
            'fim' => $tarefas->max(fn ($t) => $t->fim->toDateString()),
        ];

        return [$tarefas, $periodo];
    }

    public function criar(User $ator, int $projetoId, array $dados): Tarefa
    {
        $projeto = $this->projetos->encontrarVisivel($ator, $projetoId);
        $responsaveis = array_values(array_unique(array_map('intval', $dados['responsaveis'] ?? [])));

        $this->validarResponsaveis($projeto, $responsaveis, []);
        $this->garantirAutoAtribuicao($ator, $responsaveis);

        return $this->tarefas->criar($projeto, Arr::except($dados, ['responsaveis']), $responsaveis);
    }

    public function detalhar(User $ator, int $id): Tarefa
    {
        return $this->tarefas->encontrarVisivel($ator, $id);
    }

    public function atualizar(User $ator, int $id, array $dados): Tarefa
    {
        $tarefa = $this->tarefas->encontrarVisivel($ator, $id);
        $responsaveis = array_values(array_unique(array_map('intval', $dados['responsaveis'] ?? [])));

        $atuais = $tarefa->responsaveis->pluck('id')->map(fn ($i) => (int) $i)->all();
        $this->validarResponsaveis($tarefa->projeto, $responsaveis, $atuais);
        $this->garantirAutoAtribuicao($ator, $responsaveis);

        return $this->tarefas->atualizar($tarefa, Arr::except($dados, ['responsaveis']), $responsaveis);
    }

    /** Ao concluir grava conclusao = hoje. Ao reabrir, limpa conclusao. */
    public function alterarStatus(User $ator, int $id, string $status): Tarefa
    {
        $tarefa = $this->tarefas->encontrarVisivel($ator, $id);

        if ($status === Tarefa::CONCLUIDA) {
            $dados = ['status' => $status];
            if (! $tarefa->estaConcluida()) {
                $dados['conclusao'] = Data::hoje()->toDateString();
            }
        } else {
            $dados = ['status' => $status, 'conclusao' => null];
        }

        return $this->tarefas->atualizar($tarefa, $dados);
    }

    /**
     * Arrastar cartão no Kanban.
     * Coluna 3: concluída, conclusao = hoje.
     * Colunas 0, 1 e 2: fim vira a sexta-feira da semana alvo; se o início ficar depois do novo fim,
     * vira a segunda-feira dessa semana. Se vinha de concluída, volta para andamento e limpa conclusao.
     */
    public function mover(User $ator, int $id, int $coluna): Tarefa
    {
        $tarefa = $this->tarefas->encontrarVisivel($ator, $id);

        if ($tarefa->coluna === $coluna) {
            return $tarefa;
        }

        if ($coluna === 3) {
            $dados = ['status' => Tarefa::CONCLUIDA, 'conclusao' => Data::hoje()->toDateString()];
        } else {
            $segunda = Data::segundaDaSemana(Data::hoje())->addWeeks($coluna);
            $sexta = $segunda->copy()->addDays(4);

            $dados = ['fim' => $sexta->toDateString()];

            if ($tarefa->inicio->toDateString() > $dados['fim']) {
                $dados['inicio'] = $segunda->toDateString();
            }

            if ($tarefa->estaConcluida()) {
                $dados['status'] = Tarefa::ANDAMENTO;
                $dados['conclusao'] = null;
            }
        }

        return $this->tarefas->atualizar($tarefa, $dados);
    }

    public function excluir(User $ator, int $id): void
    {
        $this->tarefas->excluir($this->tarefas->encontrarVisivel($ator, $id));
    }

    public function minhas(User $ator, array $filtros): Collection
    {
        $somenteAbertas = ($filtros['status'] ?? 'abertas') !== 'todas';
        $limite = max(1, min(100, (int) ($filtros['limite'] ?? 6)));

        return $this->tarefas->minhas($ator, $somenteAbertas, $limite);
    }

    /** Responsáveis devem ser membros ativos do projeto (quem já era responsável pode permanecer). */
    private function validarResponsaveis(Projeto $projeto, array $ids, array $atuais): void
    {
        $permitidos = array_merge($this->projetos->idsDosMembrosAtivos($projeto), $atuais);
        $membros = $this->projetos->idsDosMembros($projeto);

        foreach ($ids as $id) {
            $jaEra = in_array($id, $atuais, true);
            $valido = $jaEra ? in_array($id, $membros, true) : in_array($id, $permitidos, true);

            if (! $valido) {
                throw ApiException::validacao('Dados inválidos.', [
                    'responsaveis' => 'todos os responsáveis devem ser membros ativos do projeto',
                ]);
            }
        }
    }

    /** Membro só cria/edita tarefas atribuídas a ele mesmo. */
    private function garantirAutoAtribuicao(User $ator, array $responsaveis): void
    {
        $irrestrito = $ator->temPermissao('tarefas.ver_todas') || $ator->temPermissao('tarefas.ver_do_projeto');

        if (! $irrestrito && ! in_array($ator->id, $responsaveis, true)) {
            throw ApiException::semPermissao('Você só pode gerenciar tarefas atribuídas a você.');
        }
    }
}
