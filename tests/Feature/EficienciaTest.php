<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class EficienciaTest extends TestCase
{
    use RefreshDatabase, PreparaCenario;

    private User $diretor;
    private User $gerente;
    private User $ana;
    private User $bruno;
    private $projeto;

    protected function setUp(): void
    {
        parent::setUp();
        $this->diretor = User::factory()->diretor()->create();
        $this->gerente = User::factory()->gerente()->create();
        $this->ana = User::factory()->create(['nome' => 'Ana']);
        $this->bruno = User::factory()->create(['nome' => 'Bruno']);
        $this->projeto = $this->criarProjeto([$this->gerente, $this->ana, $this->bruno]);

        // Ana: 2 concluídas (1 no prazo), 1 atrasada em aberto => 1 / 3
        $this->criarTarefa($this->projeto, [$this->ana], ['fim' => '2026-10-05', 'status' => 'concluida', 'conclusao' => '2026-10-04']);
        $this->criarTarefa($this->projeto, [$this->ana], ['fim' => '2026-10-05', 'status' => 'concluida', 'conclusao' => '2026-10-06']);
        $this->criarTarefa($this->projeto, [$this->ana], ['fim' => '2026-10-01']);
        // Bruno: 1 concluída no prazo, 1 aberta no prazo => 1 / 1
        $this->criarTarefa($this->projeto, [$this->bruno], ['fim' => '2026-10-10', 'status' => 'concluida', 'conclusao' => '2026-10-07']);
        $this->criarTarefa($this->projeto, [$this->bruno], ['fim' => '2026-10-20', 'status' => 'andamento']);
    }

    public function test_tabela_de_eficiencia_por_membro(): void
    {
        $this->entrar($this->diretor);

        $r = $this->getJson('/api/efficiency/members')->assertOk();

        $this->assertSame([
            ['usuarioId' => $this->ana->id, 'nome' => 'Ana', 'perfil' => 'membro', 'total' => 3, 'concluidas' => 2, 'abertas' => 1, 'atrasadas' => 1, 'noPrazo' => 1, 'eficiencia' => 33],
            ['usuarioId' => $this->bruno->id, 'nome' => 'Bruno', 'perfil' => 'membro', 'total' => 2, 'concluidas' => 1, 'abertas' => 1, 'atrasadas' => 0, 'noPrazo' => 1, 'eficiencia' => 100],
        ], $r->json('dados'));
    }

    public function test_ordenacao_e_filtros(): void
    {
        $this->entrar($this->diretor);

        $this->getJson('/api/efficiency/members?ordenar=eficiencia&direcao=desc')->assertJsonPath('dados.0.nome', 'Bruno');
        $this->getJson('/api/efficiency/members?ordenar=atrasadas&direcao=desc')->assertJsonPath('dados.0.nome', 'Ana');
        $this->getJson('/api/efficiency/members?perfil=gerente')->assertJsonCount(0, 'dados');
        $this->getJson('/api/efficiency/members?de=2026-10-09')->assertJsonCount(1, 'dados')->assertJsonPath('dados.0.nome', 'Bruno');
    }

    public function test_eficiencia_e_null_sem_base_de_calculo(): void
    {
        $this->entrar($this->diretor);
        $carla = User::factory()->create(['nome' => 'Carla']);
        $this->projeto->membros()->attach($carla->id);
        $this->criarTarefa($this->projeto, [$carla], ['fim' => '2026-10-30']);

        $this->getJson('/api/efficiency/members?ordenar=nome')->assertJsonPath('dados.2.eficiencia', null);
    }

    public function test_membro_ve_somente_a_propria_eficiencia(): void
    {
        $this->entrar($this->ana);

        $this->getJson('/api/efficiency/members')
            ->assertJsonCount(1, 'dados')
            ->assertJsonPath('dados.0.usuarioId', $this->ana->id);
    }

    public function test_gerente_ve_os_membros_dos_seus_projetos_e_nao_dos_outros(): void
    {
        $this->entrar($this->gerente);
        $this->getJson('/api/efficiency/members')->assertJsonCount(2, 'dados');

        $this->entrar(User::factory()->gerente()->create());
        $this->getJson('/api/efficiency/members')->assertJsonCount(0, 'dados');
        $this->getJson('/api/efficiency/insights')->assertOk()
            ->assertJsonPath('maisEficiente', null)
            ->assertJsonPath('maiorCarga', null)
            ->assertJsonPath('atrasos', null)
            ->assertJsonPath('entregaNoPrazo', null);
    }

    public function test_insights(): void
    {
        $this->entrar($this->diretor);

        $this->getJson('/api/efficiency/insights')
            ->assertOk()
            ->assertJsonPath('maisEficiente.usuarioId', $this->bruno->id)
            ->assertJsonPath('maisEficiente.eficiencia', 100)
            ->assertJsonPath('maiorCarga.abertas', 1)
            ->assertJsonPath('atrasos.total', 1)
            ->assertJsonPath('atrasos.projetoMaisAtrasado.id', $this->projeto->id)
            ->assertJsonPath('atrasos.projetoMaisAtrasado.quantidade', 1)
            ->assertJsonPath('entregaNoPrazo.concluidas', 3)
            ->assertJsonPath('entregaNoPrazo.noPrazo', 2)
            ->assertJsonPath('entregaNoPrazo.percentual', 67);
    }

    public function test_progresso_por_projeto(): void
    {
        $this->entrar($this->diretor);
        $this->criarProjeto([], ['status' => 'concluido']);

        $this->getJson('/api/efficiency/projects?status=em_execucao')
            ->assertOk()
            ->assertJsonCount(1, 'dados')
            ->assertJsonPath('dados.0.projetoId', $this->projeto->id)
            ->assertJsonPath('dados.0.progresso', 60)
            ->assertJsonPath('dados.0.tarefasAtrasadas', 1);
    }
}
