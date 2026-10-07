<?php

namespace Tests\Feature;

use App\Models\Tarefa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class TarefaTest extends TestCase
{
    use RefreshDatabase, PreparaCenario;

    private User $diretor;
    private User $gerente;
    private User $m1;
    private User $m2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->diretor = User::factory()->diretor()->create();
        $this->gerente = User::factory()->gerente()->create();
        $this->m1 = User::factory()->create(['nome' => 'Ana']);
        $this->m2 = User::factory()->create(['nome' => 'Bruno']);
    }

    private function cenario(): array
    {
        $projeto = $this->criarProjeto([$this->gerente, $this->m1, $this->m2]);
        $t1 = $this->criarTarefa($projeto, [$this->m1], ['prioridade' => 'P1', 'inicio' => '2026-10-01', 'fim' => '2026-10-09']);
        $t2 = $this->criarTarefa($projeto, [$this->m1, $this->m2], ['prioridade' => 'P2', 'inicio' => '2026-10-05', 'fim' => '2026-10-16']);
        $t3 = $this->criarTarefa($projeto, [$this->m2], ['prioridade' => 'P2', 'inicio' => '2026-09-20', 'fim' => '2026-10-01']);

        return [$projeto, $t1, $t2, $t3];
    }

    public function test_diretor_lista_tarefas_ordenadas_com_coluna_atrasada_e_periodo(): void
    {
        [$projeto, $t1, $t2, $t3] = $this->cenario();
        $this->entrar($this->diretor);

        $r = $this->getJson("/api/projects/{$projeto->id}/tasks")->assertOk();

        $this->assertSame([$t1->id, $t3->id, $t2->id], collect($r->json('dados'))->pluck('id')->all());
        $this->assertSame([0, 0, 1], collect($r->json('dados'))->pluck('coluna')->all());
        $this->assertSame([false, true, false], collect($r->json('dados'))->pluck('atrasada')->all());
        $r->assertJsonPath('periodo', ['inicio' => '2026-09-20', 'fim' => '2026-10-16']);
    }

    public function test_gerente_ve_todas_as_tarefas_do_seu_projeto_e_membro_so_as_suas(): void
    {
        [$projeto] = $this->cenario();

        $this->entrar($this->gerente);
        $this->getJson("/api/projects/{$projeto->id}/tasks")->assertJsonCount(3, 'dados');

        $this->entrar($this->m1);
        $this->getJson("/api/projects/{$projeto->id}/tasks")->assertJsonCount(2, 'dados');

        $this->entrar($this->m2);
        $this->getJson("/api/projects/{$projeto->id}/tasks")->assertJsonCount(2, 'dados');
    }

    public function test_filtros_da_listagem(): void
    {
        [$projeto, , , $t3] = $this->cenario();
        $this->entrar($this->diretor);

        $this->getJson("/api/projects/{$projeto->id}/tasks?prioridade=P1")->assertJsonCount(1, 'dados');
        $this->getJson("/api/projects/{$projeto->id}/tasks?responsavel={$this->m2->id}")->assertJsonCount(2, 'dados');
        $this->getJson("/api/projects/{$projeto->id}/tasks?status=pendente&responsavel={$this->m2->id}&prioridade=P2")
            ->assertJsonCount(2, 'dados');
    }

    public function test_quem_nao_participa_do_projeto_recebe_404(): void
    {
        [$projeto] = $this->cenario();
        $this->entrar(User::factory()->create());

        $this->getJson("/api/projects/{$projeto->id}/tasks")->assertNotFound();
    }

    public function test_gerente_cria_tarefa_com_responsaveis_membros_do_projeto(): void
    {
        [$projeto] = $this->cenario();
        $this->entrar($this->gerente);

        $this->postJson("/api/projects/{$projeto->id}/tasks", [
            'titulo' => 'Nova', 'prioridade' => 'P1', 'responsaveis' => [$this->m1->id],
            'inicio' => '2026-10-07', 'fim' => '2026-10-20',
        ])->assertCreated()
            ->assertJsonPath('status', 'pendente')
            ->assertJsonPath('conclusao', null)
            ->assertJsonPath('responsaveis.0.nome', 'Ana')
            ->assertJsonPath('projetoId', $projeto->id);
    }

    public function test_responsavel_fora_do_projeto_ou_inativo_devolve_422(): void
    {
        [$projeto] = $this->cenario();
        $this->entrar($this->gerente);
        $base = ['titulo' => 'Nova', 'prioridade' => 'P1', 'inicio' => '2026-10-07', 'fim' => '2026-10-20'];

        $fora = User::factory()->create();
        $this->postJson("/api/projects/{$projeto->id}/tasks", $base + ['responsaveis' => [$fora->id]])
            ->assertStatus(422)->assertJsonStructure(['erro' => ['campos' => ['responsaveis']]]);

        $inativo = User::factory()->inativo()->create();
        $projeto->membros()->attach($inativo->id);
        $this->postJson("/api/projects/{$projeto->id}/tasks", $base + ['responsaveis' => [$inativo->id]])->assertStatus(422);

        $this->postJson("/api/projects/{$projeto->id}/tasks", $base + ['fim' => '2026-10-01', 'responsaveis' => []])
            ->assertStatus(422)->assertJsonStructure(['erro' => ['campos' => ['fim']]]);
    }

    public function test_membro_so_cria_tarefa_atribuida_a_si_mesmo(): void
    {
        [$projeto] = $this->cenario();
        $this->entrar($this->m1);
        $base = ['titulo' => 'Minha', 'prioridade' => 'P3', 'inicio' => '2026-10-07', 'fim' => '2026-10-20'];

        $this->postJson("/api/projects/{$projeto->id}/tasks", $base + ['responsaveis' => [$this->m2->id]])->assertForbidden();
        $this->postJson("/api/projects/{$projeto->id}/tasks", $base + ['responsaveis' => [$this->m1->id]])->assertCreated();
    }

    public function test_membro_nao_mexe_em_tarefa_de_outro(): void
    {
        [, $t1, , $t3] = $this->cenario();
        $this->entrar($this->m1);

        $this->getJson("/api/tasks/{$t1->id}")->assertOk();
        $this->getJson("/api/tasks/{$t3->id}")->assertNotFound();
        $this->patchJson("/api/tasks/{$t3->id}/status", ['status' => 'concluida'])->assertNotFound();
        $this->patchJson("/api/tasks/{$t3->id}/move", ['coluna' => 1])->assertNotFound();
        $this->deleteJson("/api/tasks/{$t3->id}")->assertNotFound();
    }

    public function test_edita_tarefa(): void
    {
        [, $t1] = $this->cenario();
        $this->entrar($this->gerente);

        $this->putJson("/api/tasks/{$t1->id}", [
            'titulo' => 'Editada', 'prioridade' => 'P4', 'responsaveis' => [$this->m2->id],
            'inicio' => '2026-10-02', 'fim' => '2026-10-10',
        ])->assertOk()
            ->assertJsonPath('titulo', 'Editada')
            ->assertJsonPath('prioridade', 'P4')
            ->assertJsonPath('responsaveis.0.id', $this->m2->id);
    }

    public function test_concluir_grava_data_de_hoje_e_reabrir_limpa(): void
    {
        [, $t1] = $this->cenario();
        $this->entrar($this->m1);

        $this->patchJson("/api/tasks/{$t1->id}/status", ['status' => 'concluida'])
            ->assertOk()
            ->assertJsonPath('status', 'concluida')
            ->assertJsonPath('conclusao', '2026-10-07')
            ->assertJsonPath('coluna', 3);

        $this->patchJson("/api/tasks/{$t1->id}/status", ['status' => 'andamento'])
            ->assertJsonPath('status', 'andamento')
            ->assertJsonPath('conclusao', null);

        $this->patchJson("/api/tasks/{$t1->id}/status", ['status' => 'xpto'])->assertStatus(422);
    }

    public function test_mover_para_outra_coluna_ajusta_fim_para_a_sexta_e_inicio_para_a_segunda(): void
    {
        $projeto = $this->criarProjeto([$this->m1]);
        $t = $this->criarTarefa($projeto, [$this->m1], ['inicio' => '2026-10-12', 'fim' => '2026-10-16']);
        $this->entrar($this->m1);

        $this->patchJson("/api/tasks/{$t->id}/move", ['coluna' => 0])
            ->assertOk()
            ->assertJsonPath('fim', '2026-10-09')
            ->assertJsonPath('inicio', '2026-10-05')
            ->assertJsonPath('coluna', 0);

        $this->patchJson("/api/tasks/{$t->id}/move", ['coluna' => 2])
            ->assertJsonPath('fim', '2026-10-23')
            ->assertJsonPath('inicio', '2026-10-05')
            ->assertJsonPath('coluna', 2);
    }

    public function test_mover_para_a_mesma_coluna_nao_altera_nada(): void
    {
        $projeto = $this->criarProjeto([$this->m1]);
        $t = $this->criarTarefa($projeto, [$this->m1], ['inicio' => '2026-10-01', 'fim' => '2026-10-08']);
        $this->entrar($this->m1);

        $this->patchJson("/api/tasks/{$t->id}/move", ['coluna' => 0])->assertOk()->assertJsonPath('fim', '2026-10-08');
        $this->assertSame('2026-10-08', $t->fresh()->fim->toDateString());
    }

    public function test_mover_para_concluido_e_voltar(): void
    {
        $projeto = $this->criarProjeto([$this->m1]);
        $t = $this->criarTarefa($projeto, [$this->m1], ['inicio' => '2026-10-01', 'fim' => '2026-10-16']);
        $this->entrar($this->m1);

        $this->patchJson("/api/tasks/{$t->id}/move", ['coluna' => 3])
            ->assertJsonPath('status', 'concluida')
            ->assertJsonPath('conclusao', '2026-10-07');

        $this->patchJson("/api/tasks/{$t->id}/move", ['coluna' => 1])
            ->assertJsonPath('status', 'andamento')
            ->assertJsonPath('conclusao', null)
            ->assertJsonPath('fim', '2026-10-16')
            ->assertJsonPath('coluna', 1);

        $this->patchJson("/api/tasks/{$t->id}/move", ['coluna' => 7])->assertStatus(422);
    }

    public function test_exclui_tarefa(): void
    {
        [, $t1] = $this->cenario();
        $this->entrar($this->gerente);

        $this->deleteJson("/api/tasks/{$t1->id}")->assertNoContent();
        $this->assertNull(Tarefa::find($t1->id));
    }

    public function test_minhas_tarefas_trazem_so_abertas_do_usuario_com_nome_do_projeto(): void
    {
        [$projeto, $t1, $t2] = $this->cenario();
        $this->criarTarefa($projeto, [$this->m1], ['status' => 'concluida', 'conclusao' => '2026-10-02']);
        $this->entrar($this->m1);

        $r = $this->getJson('/api/me/tasks')->assertOk();
        $this->assertSame([$t1->id, $t2->id], collect($r->json('dados'))->pluck('id')->all());
        $r->assertJsonPath('dados.0.projetoNome', $projeto->nome);

        $this->getJson('/api/me/tasks?status=todas')->assertJsonCount(3, 'dados');
        $this->getJson('/api/me/tasks?limite=1')->assertJsonCount(1, 'dados');
    }
}
