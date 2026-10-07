<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase, PreparaCenario;

    public function test_resumo_do_diretor(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $a = $this->criarProjeto([], ['status' => 'em_execucao']);
        $this->criarProjeto([], ['status' => 'concluido']);
        $this->criarTarefa($a, [], ['status' => 'concluida', 'conclusao' => '2026-10-02', 'fim' => '2026-10-05']);
        $this->criarTarefa($a, [], ['status' => 'pendente', 'fim' => '2026-10-01']);
        $this->criarTarefa($a, [], ['status' => 'andamento', 'fim' => '2026-10-30']);

        $this->getJson('/api/dashboard/summary')
            ->assertOk()
            ->assertExactJson([
                'projetosEmExecucao' => 1,
                'tarefasConcluidas' => 1,
                'tarefasAbertas' => 2,
                'tarefasAtrasadas' => 1,
                'totalTarefas' => 3,
                'tarefasPorStatus' => ['pendente' => 1, 'andamento' => 1, 'concluida' => 1],
            ]);
    }

    public function test_resumo_filtra_por_projeto(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $a = $this->criarProjeto();
        $b = $this->criarProjeto();
        $this->criarTarefa($a);
        $this->criarTarefa($b);
        $this->criarTarefa($b);

        $this->getJson("/api/dashboard/summary?projetoId={$b->id}")->assertJsonPath('totalTarefas', 2);
    }

    public function test_membro_ve_apenas_os_indicadores_das_suas_tarefas(): void
    {
        $membro = User::factory()->create();
        $outro = User::factory()->create();
        $projeto = $this->criarProjeto([$membro, $outro]);
        $this->criarTarefa($projeto, [$membro]);
        $this->criarTarefa($projeto, [$outro]);
        $this->criarTarefa($projeto, [$outro]);

        $this->entrar($membro);

        $this->getJson('/api/dashboard/summary')->assertJsonPath('totalTarefas', 1)->assertJsonPath('projetosEmExecucao', 1);
    }

    public function test_burndown_ideal_linear_e_real_somente_ate_hoje(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $projeto = $this->criarProjeto();
        $this->criarTarefa($projeto, [], ['inicio' => '2026-10-05', 'fim' => '2026-10-08', 'status' => 'concluida', 'conclusao' => '2026-10-06']);
        $this->criarTarefa($projeto, [], ['inicio' => '2026-10-06', 'fim' => '2026-10-09']);

        $r = $this->getJson('/api/dashboard/burndown')
            ->assertOk()
            ->assertJsonPath('inicio', '2026-10-05')
            ->assertJsonPath('fim', '2026-10-09')
            ->assertJsonPath('total', 2);

        $this->assertEquals([2, 1.5, 1, 0.5, 0], array_column($r->json('ideal'), 'restante'));
        $this->assertSame(['2026-10-05', '2026-10-06', '2026-10-07'], array_column($r->json('real'), 'data'));
        $this->assertSame([2, 1, 1], array_column($r->json('real'), 'restante'));
    }

    public function test_burndown_sem_tarefas(): void
    {
        $this->entrar(User::factory()->diretor()->create());

        $this->getJson('/api/dashboard/burndown')
            ->assertOk()
            ->assertJsonPath('total', 0)
            ->assertJsonPath('ideal', [])
            ->assertJsonPath('real', []);
    }
}
