<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\ProjetoRepository;
use App\Repositories\TarefaRepository;

class EficienciaService
{
    private const ORDENAVEIS = ['nome', 'total', 'concluidas', 'abertas', 'atrasadas', 'eficiencia'];

    public function __construct(
        private readonly TarefaRepository $tarefas,
        private readonly ProjetoRepository $projetos,
    ) {
    }

    /** Eficiência = noPrazo / (concluídas + atrasadas em aberto) x 100, arredondada. Sem base: null. */
    public static function calcular(int $noPrazo, int $concluidas, int $atrasadasEmAberto): ?int
    {
        $base = $concluidas + $atrasadasEmAberto;

        return $base === 0 ? null : (int) round($noPrazo / $base * 100);
    }

    public function membros(User $ator, array $filtros): array
    {
        $tarefas = $this->tarefas->paraEficiencia($ator, $filtros);
        $somenteProprio = $this->somenteProprio($ator);

        $linhas = [];

        foreach ($tarefas as $tarefa) {
            foreach ($tarefa->responsaveis as $responsavel) {
                if ($somenteProprio && $responsavel->id !== $ator->id) {
                    continue;
                }

                if (! empty($filtros['perfil']) && $responsavel->perfil !== $filtros['perfil']) {
                    continue;
                }

                $linha = &$linhas[$responsavel->id];
                $linha ??= [
                    'usuarioId' => $responsavel->id,
                    'nome' => $responsavel->nome,
                    'perfil' => $responsavel->perfil,
                    'total' => 0, 'concluidas' => 0, 'abertas' => 0, 'atrasadas' => 0, 'noPrazo' => 0,
                ];

                $linha['total']++;

                if ($tarefa->estaConcluida()) {
                    $linha['concluidas']++;
                    if ($tarefa->conclusao !== null && $tarefa->conclusao->toDateString() <= $tarefa->fim->toDateString()) {
                        $linha['noPrazo']++;
                    }
                } else {
                    $linha['abertas']++;
                    if ($tarefa->atrasada) {
                        $linha['atrasadas']++;
                    }
                }

                unset($linha);
            }
        }

        $linhas = array_map(function ($l) {
            $l['eficiencia'] = self::calcular($l['noPrazo'], $l['concluidas'], $l['atrasadas']);

            return $l;
        }, array_values($linhas));

        return $this->ordenar($linhas, $filtros['ordenar'] ?? 'nome', $filtros['direcao'] ?? 'asc');
    }

    public function insights(User $ator, array $filtros): array
    {
        $tarefas = $this->tarefas->paraEficiencia($ator, $filtros);
        $membros = $this->membros($ator, ['ordenar' => 'nome'] + $filtros);

        $comEficiencia = array_values(array_filter($membros, fn ($m) => $m['eficiencia'] !== null));
        usort($comEficiencia, fn ($a, $b) => [$b['eficiencia'], $b['concluidas'], $a['nome']] <=> [$a['eficiencia'], $a['concluidas'], $b['nome']]);
        $maisEficiente = $comEficiencia[0] ?? null;

        $comCarga = array_values(array_filter($membros, fn ($m) => $m['abertas'] > 0));
        usort($comCarga, fn ($a, $b) => [$b['abertas'], $a['nome']] <=> [$a['abertas'], $b['nome']]);
        $maiorCarga = $comCarga[0] ?? null;

        $atrasadas = $tarefas->filter(fn ($t) => $t->atrasada);
        $concluidas = $tarefas->filter->estaConcluida();
        $noPrazo = $concluidas->filter(fn ($t) => $t->conclusao !== null && $t->conclusao->toDateString() <= $t->fim->toDateString());

        $porProjeto = $atrasadas->groupBy('projeto_id')->map->count()->sortDesc();
        $projetoMaisAtrasado = null;
        if ($porProjeto->isNotEmpty()) {
            $projetoId = $porProjeto->keys()->first();
            $projetoMaisAtrasado = [
                'id' => (int) $projetoId,
                'nome' => $atrasadas->firstWhere('projeto_id', $projetoId)->projeto?->nome,
                'quantidade' => $porProjeto->first(),
            ];
        }

        return [
            'maisEficiente' => $maisEficiente ? [
                'usuarioId' => $maisEficiente['usuarioId'],
                'nome' => $maisEficiente['nome'],
                'eficiencia' => $maisEficiente['eficiencia'],
            ] : null,
            'maiorCarga' => $maiorCarga ? [
                'usuarioId' => $maiorCarga['usuarioId'],
                'nome' => $maiorCarga['nome'],
                'abertas' => $maiorCarga['abertas'],
            ] : null,
            'atrasos' => $tarefas->isEmpty() ? null : [
                'total' => $atrasadas->count(),
                'projetoMaisAtrasado' => $projetoMaisAtrasado,
            ],
            'entregaNoPrazo' => $concluidas->isEmpty() ? null : [
                'percentual' => (int) round($noPrazo->count() / $concluidas->count() * 100),
                'noPrazo' => $noPrazo->count(),
                'concluidas' => $concluidas->count(),
            ],
        ];
    }

    public function projetos(User $ator, ?string $status): array
    {
        return $this->projetos->visiveisComTarefas($ator, $status)
            ->map(fn ($p) => [
                'projetoId' => $p->id,
                'nome' => $p->nome,
                'status' => $p->status,
                'progresso' => $p->progresso,
                'tarefasAtrasadas' => $p->tarefas->filter(fn ($t) => $t->atrasada)->count(),
            ])
            ->values()
            ->all();
    }

    /** Diretor e gerente enxergam vários membros; membro, só a própria eficiência. */
    private function somenteProprio(User $ator): bool
    {
        return ! $ator->temPermissao('eficiencia.ver_todos') && ! $ator->temPermissao('eficiencia.ver_do_projeto');
    }

    private function ordenar(array $linhas, string $campo, string $direcao): array
    {
        $campo = in_array($campo, self::ORDENAVEIS, true) ? $campo : 'nome';
        $sinal = strtolower($direcao) === 'desc' ? -1 : 1;

        usort($linhas, function ($a, $b) use ($campo, $sinal) {
            $va = $a[$campo] ?? -1;
            $vb = $b[$campo] ?? -1;
            $cmp = $campo === 'nome' ? strcasecmp($va, $vb) : $va <=> $vb;

            return $cmp !== 0 ? $cmp * $sinal : strcasecmp($a['nome'], $b['nome']);
        });

        return $linhas;
    }
}
