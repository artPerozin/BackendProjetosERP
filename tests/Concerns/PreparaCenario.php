<?php

namespace Tests\Concerns;

use App\Models\Projeto;
use App\Models\Tarefa;
use App\Models\User;
use Carbon\Carbon;
use Laravel\Sanctum\Sanctum;

/**
 * Fixa "hoje" em quarta-feira 2026-10-07 (America/Sao_Paulo).
 * Semana atual: segunda 2026-10-05 a domingo 2026-10-11.
 */
trait PreparaCenario
{
    protected function setUpPreparaCenario(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-07 10:00:00', 'America/Sao_Paulo'));
    }

    protected function tearDownPreparaCenario(): void
    {
        Carbon::setTestNow();
    }

    protected function entrar(User $usuario): User
    {
        Sanctum::actingAs($usuario, ['*']);

        return $usuario;
    }

    /** @param  User[]  $membros */
    protected function criarProjeto(array $membros = [], array $atributos = []): Projeto
    {
        $projeto = Projeto::factory()->create($atributos);
        $projeto->membros()->attach(collect($membros)->pluck('id')->all());

        return $projeto;
    }

    /** @param  User[]  $responsaveis */
    protected function criarTarefa(Projeto $projeto, array $responsaveis = [], array $atributos = []): Tarefa
    {
        $tarefa = Tarefa::factory()->create($atributos + ['projeto_id' => $projeto->id]);
        $tarefa->responsaveis()->attach(collect($responsaveis)->pluck('id')->all());

        return $tarefa;
    }
}
