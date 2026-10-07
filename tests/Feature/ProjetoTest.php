<?php

namespace Tests\Feature;

use App\Models\Projeto;
use App\Models\Tarefa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class ProjetoTest extends TestCase
{
    use RefreshDatabase, PreparaCenario;

    private function corpo(array $membros, array $extra = []): array
    {
        return $extra + [
            'nome' => 'Projeto Alfa',
            'descricao' => 'Descrição',
            'inicio' => '2026-10-01',
            'fim' => '2026-12-01',
            'membros' => collect($membros)->pluck('id')->all(),
        ];
    }

    public function test_diretor_cadastra_projeto_em_execucao(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        [$a, $b] = [User::factory()->create(), User::factory()->create()];

        $this->postJson('/api/projects', $this->corpo([$a, $b]))
            ->assertCreated()
            ->assertJsonPath('status', 'em_execucao')
            ->assertJsonPath('progresso', 0)
            ->assertJsonCount(2, 'membros')
            ->assertJsonStructure(['id', 'nome', 'descricao', 'inicio', 'fim', 'status', 'membros' => [['id', 'nome', 'perfil']], 'progresso']);
    }

    public function test_gerente_que_cria_projeto_passa_a_ser_membro_dele(): void
    {
        $gerente = $this->entrar(User::factory()->gerente()->create());
        $membro = User::factory()->create();

        $resposta = $this->postJson('/api/projects', $this->corpo([$membro]))->assertCreated();

        $ids = collect($resposta->json('membros'))->pluck('id')->all();
        $this->assertContains($gerente->id, $ids);
        $this->assertContains($membro->id, $ids);
    }

    public function test_membro_nao_cria_edita_nem_exclui_projeto(): void
    {
        $membro = $this->entrar(User::factory()->create());
        $projeto = $this->criarProjeto([$membro]);

        $this->postJson('/api/projects', $this->corpo([]))->assertForbidden();
        $this->putJson("/api/projects/{$projeto->id}", $this->corpo([$membro]))->assertForbidden();
        $this->patchJson("/api/projects/{$projeto->id}/status", ['status' => 'concluido'])->assertForbidden();
        $this->deleteJson("/api/projects/{$projeto->id}")->assertForbidden();
    }

    public function test_validacoes_de_cadastro(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $inativo = User::factory()->inativo()->create();

        $this->postJson('/api/projects', $this->corpo([], ['fim' => '2026-09-01']))
            ->assertStatus(422)
            ->assertJsonStructure(['erro' => ['campos' => ['fim']]]);

        $this->postJson('/api/projects', $this->corpo([$inativo]))
            ->assertStatus(422)
            ->assertJsonStructure(['erro' => ['campos' => ['membros']]]);

        $this->postJson('/api/projects', ['nome' => ''])->assertStatus(422);
    }

    public function test_listagem_respeita_o_escopo_de_cada_perfil(): void
    {
        $diretor = User::factory()->diretor()->create();
        $gerente = User::factory()->gerente()->create();
        $m1 = User::factory()->create();
        $m2 = User::factory()->create();

        $a = $this->criarProjeto([$gerente, $m1], ['nome' => 'A']);
        $this->criarProjeto([$m2], ['nome' => 'B']);

        $this->entrar($diretor);
        $this->getJson('/api/projects')->assertJsonPath('total', 2);

        $this->entrar($gerente);
        $this->getJson('/api/projects')->assertJsonPath('total', 1)->assertJsonPath('dados.0.id', $a->id);

        $this->entrar($m1);
        $this->getJson('/api/projects')->assertJsonPath('total', 1)->assertJsonPath('dados.0.id', $a->id);

        $this->entrar($m2);
        $this->getJson("/api/projects/{$a->id}")->assertNotFound();
    }

    public function test_gerente_nao_altera_projeto_de_que_nao_participa(): void
    {
        $gerente = $this->entrar(User::factory()->gerente()->create());
        $outro = $this->criarProjeto([User::factory()->gerente()->create()]);

        $this->putJson("/api/projects/{$outro->id}", $this->corpo([$gerente]))->assertNotFound();
        $this->deleteJson("/api/projects/{$outro->id}")->assertNotFound();
    }

    public function test_progresso_e_calculado_pelas_tarefas_concluidas(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $projeto = $this->criarProjeto();
        $this->criarTarefa($projeto, [], ['status' => 'concluida', 'conclusao' => '2026-10-05']);
        $this->criarTarefa($projeto);
        $this->criarTarefa($projeto);
        $this->criarTarefa($projeto);

        $this->getJson("/api/projects/{$projeto->id}")->assertJsonPath('progresso', 25);
        $this->getJson('/api/projects')->assertJsonPath('dados.0.progresso', 25);
    }

    public function test_filtro_por_status_busca_e_ordenacao_por_progresso(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $zero = $this->criarProjeto([], ['nome' => 'Zero', 'descricao' => 'x']);
        $metade = $this->criarProjeto([], ['nome' => 'Metade', 'descricao' => 'x']);
        $this->criarProjeto([], ['nome' => 'Fechado', 'descricao' => 'x', 'status' => 'concluido']);
        $this->criarTarefa($zero);
        $this->criarTarefa($metade, [], ['status' => 'concluida', 'conclusao' => '2026-10-01']);
        $this->criarTarefa($metade);

        $this->getJson('/api/projects?status=concluido')->assertJsonPath('total', 1)->assertJsonPath('dados.0.nome', 'Fechado');
        $this->getJson('/api/projects?q=met')->assertJsonPath('total', 1);
        $this->getJson('/api/projects?status=em_execucao&ordenar=progresso&direcao=desc')
            ->assertJsonPath('dados.0.nome', 'Metade');
    }

    public function test_edita_projeto_e_troca_membros(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        [$a, $b] = [User::factory()->create(), User::factory()->create()];
        $projeto = $this->criarProjeto([$a]);

        $this->putJson("/api/projects/{$projeto->id}", $this->corpo([$b], ['nome' => 'Renomeado']))
            ->assertOk()
            ->assertJsonPath('nome', 'Renomeado')
            ->assertJsonCount(1, 'membros')
            ->assertJsonPath('membros.0.id', $b->id);
    }

    public function test_remover_membro_com_tarefas_abertas_devolve_409_com_a_lista(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        [$a, $b] = [User::factory()->create(), User::factory()->create()];
        $projeto = $this->criarProjeto([$a, $b]);
        $tarefa = $this->criarTarefa($projeto, [$b], ['titulo' => 'Pendência']);

        $this->putJson("/api/projects/{$projeto->id}", $this->corpo([$a]))
            ->assertStatus(409)
            ->assertJsonPath('erro.codigo', 'MEMBRO_COM_TAREFAS_ABERTAS')
            ->assertJsonPath('erro.tarefas.0.id', $tarefa->id)
            ->assertJsonPath('erro.tarefas.0.responsaveis.0.id', $b->id);

        $this->assertCount(2, $projeto->membros()->get());
    }

    public function test_remover_membro_so_com_tarefas_concluidas_e_permitido(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        [$a, $b] = [User::factory()->create(), User::factory()->create()];
        $projeto = $this->criarProjeto([$a, $b]);
        $this->criarTarefa($projeto, [$b], ['status' => 'concluida', 'conclusao' => '2026-10-01']);

        $this->putJson("/api/projects/{$projeto->id}", $this->corpo([$a]))->assertOk()->assertJsonCount(1, 'membros');
    }

    public function test_conclui_e_reabre_projeto(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $projeto = $this->criarProjeto();

        $this->patchJson("/api/projects/{$projeto->id}/status", ['status' => 'concluido'])->assertJsonPath('status', 'concluido');
        $this->patchJson("/api/projects/{$projeto->id}/status", ['status' => 'em_execucao'])->assertJsonPath('status', 'em_execucao');
        $this->patchJson("/api/projects/{$projeto->id}/status", ['status' => 'xpto'])->assertStatus(422);
    }

    public function test_exclusao_remove_as_tarefas_em_cascata(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $projeto = $this->criarProjeto();
        $this->criarTarefa($projeto);

        $this->deleteJson("/api/projects/{$projeto->id}")->assertNoContent();

        $this->assertDatabaseMissing('projetos', ['id' => $projeto->id]);
        $this->assertSame(0, Tarefa::count());
    }
}
