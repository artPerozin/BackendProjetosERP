<?php

namespace Tests\Feature;

use App\Models\Capacitacao;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class CapacitacaoTest extends TestCase
{
    use RefreshDatabase, PreparaCenario;

    private function corpo(array $extra = []): array
    {
        return $extra + [
            'titulo' => 'Solda', 'tipo' => 'mecanica', 'data' => '2026-10-25',
            'hora' => '09:30', 'sala' => 'Lab 2', 'instrutor' => 'Carlos', 'vagas' => 5,
        ];
    }

    public function test_calendario_filtra_por_mes_periodo_e_tipo(): void
    {
        $this->entrar(User::factory()->create());
        Capacitacao::factory()->create(['data' => '2026-10-20', 'tipo' => 'computacao']);
        Capacitacao::factory()->create(['data' => '2026-10-25', 'tipo' => 'mecanica']);
        Capacitacao::factory()->create(['data' => '2026-11-05', 'tipo' => 'eletrica']);

        $this->getJson('/api/trainings?mes=2026-10')->assertJsonCount(2, 'dados');
        $this->getJson('/api/trainings?mes=2026-10&tipo=mecanica')->assertJsonCount(1, 'dados');
        $this->getJson('/api/trainings?de=2026-10-21&ate=2026-11-30')->assertJsonCount(2, 'dados');
        $this->getJson('/api/trainings?mes=outubro')->assertStatus(422);
    }

    public function test_calendario_traz_vagas_restantes_e_flag_de_inscricao(): void
    {
        $usuario = $this->entrar(User::factory()->create());
        $cap = Capacitacao::factory()->create(['vagas' => 3]);
        $cap->inscritos()->attach([$usuario->id, User::factory()->create()->id]);

        $this->getJson('/api/trainings')
            ->assertJsonPath('dados.0.vagasRestantes', 1)
            ->assertJsonPath('dados.0.inscrito', true)
            ->assertJsonCount(2, 'dados.0.inscritos');
    }

    public function test_detalhe_traz_sala_e_inscritos_com_perfil(): void
    {
        $this->entrar(User::factory()->create());
        $cap = Capacitacao::factory()->create(['sala' => 'Lab 9']);
        $cap->inscritos()->attach(User::factory()->gerente()->create()->id);

        $this->getJson("/api/trainings/{$cap->id}")
            ->assertOk()
            ->assertJsonPath('sala', 'Lab 9')
            ->assertJsonPath('inscritos.0.perfil', 'gerente');
    }

    public function test_usuario_se_inscreve_e_nao_pode_se_inscrever_duas_vezes(): void
    {
        $usuario = $this->entrar(User::factory()->create());
        $cap = Capacitacao::factory()->create(['vagas' => 2]);

        $this->postJson("/api/trainings/{$cap->id}/enrollments")
            ->assertCreated()
            ->assertJsonPath('inscrito', true)
            ->assertJsonPath('vagasRestantes', 1);

        $this->postJson("/api/trainings/{$cap->id}/enrollments")
            ->assertStatus(409)->assertJsonPath('erro.codigo', 'JA_INSCRITO');
    }

    public function test_sem_vagas_devolve_409(): void
    {
        $this->entrar(User::factory()->create());
        $cap = Capacitacao::factory()->create(['vagas' => 1]);
        $cap->inscritos()->attach(User::factory()->create()->id);

        $this->postJson("/api/trainings/{$cap->id}/enrollments")
            ->assertStatus(409)->assertJsonPath('erro.codigo', 'SEM_VAGAS');
    }

    public function test_nao_inscreve_em_capacitacao_que_ja_ocorreu(): void
    {
        $this->entrar(User::factory()->create());
        $cap = Capacitacao::factory()->create(['data' => '2026-10-01']);

        $this->postJson("/api/trainings/{$cap->id}/enrollments")
            ->assertStatus(409)->assertJsonPath('erro.codigo', 'CAPACITACAO_ENCERRADA');
    }

    public function test_membro_nao_inscreve_outra_pessoa_mas_gerente_sim(): void
    {
        $cap = Capacitacao::factory()->create();
        $alvo = User::factory()->create();

        $this->entrar(User::factory()->create());
        $this->postJson("/api/trainings/{$cap->id}/enrollments", ['usuarioId' => $alvo->id])->assertForbidden();

        $this->entrar(User::factory()->gerente()->create());
        $this->postJson("/api/trainings/{$cap->id}/enrollments", ['usuarioId' => $alvo->id])->assertCreated();
        $this->assertTrue($cap->inscritos()->where('users.id', $alvo->id)->exists());

        $inativo = User::factory()->inativo()->create();
        $this->postJson("/api/trainings/{$cap->id}/enrollments", ['usuarioId' => $inativo->id])->assertStatus(422);
    }

    public function test_cancela_a_propria_inscricao_com_me(): void
    {
        $usuario = $this->entrar(User::factory()->create());
        $cap = Capacitacao::factory()->create();
        $cap->inscritos()->attach($usuario->id);

        $this->deleteJson("/api/trainings/{$cap->id}/enrollments/me")
            ->assertOk()->assertJsonPath('inscrito', false);

        $this->deleteJson("/api/trainings/{$cap->id}/enrollments/me")->assertNotFound();
    }

    public function test_cancelar_inscricao_de_outro_exige_gerente_ou_diretor(): void
    {
        $cap = Capacitacao::factory()->create();
        $alvo = User::factory()->create();
        $cap->inscritos()->attach($alvo->id);

        $this->entrar(User::factory()->create());
        $this->deleteJson("/api/trainings/{$cap->id}/enrollments/{$alvo->id}")->assertForbidden();

        $this->entrar(User::factory()->gerente()->create());
        $this->deleteJson("/api/trainings/{$cap->id}/enrollments/{$alvo->id}")->assertOk();
    }

    public function test_gerente_gerencia_capacitacoes_e_membro_nao(): void
    {
        $this->entrar(User::factory()->create());
        $this->postJson('/api/trainings', $this->corpo())->assertForbidden();

        $this->entrar(User::factory()->gerente()->create());
        $id = $this->postJson('/api/trainings', $this->corpo())->assertCreated()->json('id');

        $this->putJson("/api/trainings/{$id}", $this->corpo(['titulo' => 'Solda 2']))
            ->assertOk()->assertJsonPath('titulo', 'Solda 2');

        $this->postJson('/api/trainings', $this->corpo(['tipo' => 'xpto', 'hora' => '9h']))
            ->assertStatus(422)->assertJsonStructure(['erro' => ['campos' => ['tipo', 'hora']]]);
    }

    public function test_reduzir_vagas_abaixo_dos_inscritos_devolve_409(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $cap = Capacitacao::factory()->create(['vagas' => 5]);
        $cap->inscritos()->attach(User::factory()->count(3)->create()->pluck('id')->all());

        $this->putJson("/api/trainings/{$cap->id}", $this->corpo(['vagas' => 2]))->assertStatus(409);
        $this->putJson("/api/trainings/{$cap->id}", $this->corpo(['vagas' => 3]))->assertOk();
    }

    public function test_exclusao_remove_as_inscricoes(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $cap = Capacitacao::factory()->create();
        $cap->inscritos()->attach(User::factory()->create()->id);

        $this->deleteJson("/api/trainings/{$cap->id}")->assertNoContent();

        $this->assertDatabaseMissing('capacitacoes', ['id' => $cap->id]);
        $this->assertDatabaseCount('capacitacao_inscricoes', 0);
    }

    public function test_minhas_capacitacoes_so_as_futuras_do_usuario(): void
    {
        $usuario = $this->entrar(User::factory()->create());
        $futura = Capacitacao::factory()->create(['data' => '2026-10-20']);
        $passada = Capacitacao::factory()->create(['data' => '2026-09-20']);
        $naoMinha = Capacitacao::factory()->create(['data' => '2026-10-22']);
        $futura->inscritos()->attach($usuario->id);
        $passada->inscritos()->attach($usuario->id);

        $this->getJson('/api/me/trainings')->assertJsonCount(1, 'dados')->assertJsonPath('dados.0.id', $futura->id);
        $this->getJson('/api/me/trainings?futuras=false')->assertJsonCount(2, 'dados');
    }
}
