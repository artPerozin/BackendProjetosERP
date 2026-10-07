<?php

namespace App\Services;

use App\Models\Tarefa;
use App\Models\User;
use App\Repositories\ProjetoRepository;
use App\Repositories\TarefaRepository;
use App\Support\Data;
use Carbon\Carbon;

class DashboardService
{
    public function __construct(
        private readonly TarefaRepository $tarefas,
        private readonly ProjetoRepository $projetos,
    ) {
    }

    public function resumo(User $ator, ?int $projetoId): array
    {
        $tarefas = $this->tarefas->paraDashboard($ator, $projetoId);

        $concluidas = $tarefas->filter->estaConcluida()->count();

        return [
            'projetosEmExecucao' => $this->projetos->contarEmExecucao($ator, $projetoId),
            'tarefasConcluidas' => $concluidas,
            'tarefasAbertas' => $tarefas->count() - $concluidas,
            'tarefasAtrasadas' => $tarefas->filter(fn ($t) => $t->atrasada)->count(),
            'totalTarefas' => $tarefas->count(),
            'tarefasPorStatus' => [
                Tarefa::PENDENTE => $tarefas->where('status', Tarefa::PENDENTE)->count(),
                Tarefa::ANDAMENTO => $tarefas->where('status', Tarefa::ANDAMENTO)->count(),
                Tarefa::CONCLUIDA => $concluidas,
            ],
        ];
    }

    /**
     * Burndown: restante(dia) = total - tarefas com conclusao <= dia.
     * "ideal" é linear, do total no menor início até 0 no maior fim; "real" vai só até hoje.
     */
    public function burndown(User $ator, ?int $projetoId): array
    {
        $tarefas = $this->tarefas->paraDashboard($ator, $projetoId);

        if ($tarefas->isEmpty()) {
            return ['inicio' => null, 'fim' => null, 'total' => 0, 'ideal' => [], 'real' => []];
        }

        $total = $tarefas->count();
        $inicio = Carbon::parse($tarefas->min(fn ($t) => $t->inicio->toDateString()), Data::FUSO);
        $fim = Carbon::parse($tarefas->max(fn ($t) => $t->fim->toDateString()), Data::FUSO);
        $hoje = Data::hoje();

        $conclusoes = $tarefas->filter(fn ($t) => $t->conclusao !== null)
            ->map(fn ($t) => $t->conclusao->toDateString())
            ->values()
            ->all();

        $dias = (int) $inicio->diffInDays($fim, true);

        $ideal = [];
        $real = [];

        for ($i = 0; $i <= $dias; $i++) {
            $dia = $inicio->copy()->addDays($i);
            $data = $dia->toDateString();

            $ideal[] = [
                'data' => $data,
                'restante' => $dias === 0 ? 0 : round($total * (1 - $i / $dias), 2),
            ];

            if ($dia->lte($hoje)) {
                $concluidasAteDia = count(array_filter($conclusoes, fn ($c) => $c <= $data));
                $real[] = ['data' => $data, 'restante' => $total - $concluidasAteDia];
            }
        }

        return [
            'inicio' => $inicio->toDateString(),
            'fim' => $fim->toDateString(),
            'total' => $total,
            'ideal' => $ideal,
            'real' => $real,
        ];
    }
}
