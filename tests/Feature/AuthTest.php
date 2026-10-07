<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase, PreparaCenario;

    public function test_login_com_credenciais_validas_devolve_token_e_usuario(): void
    {
        User::factory()->diretor()->create(['email' => 'ana@konvex.com']);

        $this->postJson('/api/auth/login', ['email' => 'ana@konvex.com', 'senha' => 'senha123'])
            ->assertOk()
            ->assertJsonStructure(['token', 'expiraEm', 'usuario' => ['id', 'nome', 'email', 'perfil', 'ativo']])
            ->assertJsonPath('usuario.perfil', 'diretor')
            ->assertJsonMissingPath('usuario.password');
    }

    public function test_login_com_senha_errada_devolve_401(): void
    {
        User::factory()->create(['email' => 'ana@konvex.com']);

        $this->postJson('/api/auth/login', ['email' => 'ana@konvex.com', 'senha' => 'errada'])
            ->assertUnauthorized()
            ->assertJsonPath('erro.codigo', 'CREDENCIAIS_INVALIDAS');
    }

    public function test_login_de_usuario_inativo_devolve_403(): void
    {
        User::factory()->inativo()->create(['email' => 'ana@konvex.com']);

        $this->postJson('/api/auth/login', ['email' => 'ana@konvex.com', 'senha' => 'senha123'])
            ->assertForbidden()
            ->assertJsonPath('erro.codigo', 'USUARIO_INATIVO');
    }

    public function test_login_exige_email_e_senha(): void
    {
        $this->postJson('/api/auth/login', [])
            ->assertStatus(422)
            ->assertJsonPath('erro.codigo', 'VALIDACAO')
            ->assertJsonStructure(['erro' => ['mensagem', 'campos' => ['email', 'senha']]]);
    }

    public function test_rotas_exigem_autenticacao(): void
    {
        $this->getJson('/api/auth/me')
            ->assertUnauthorized()
            ->assertJsonPath('erro.codigo', 'NAO_AUTENTICADO');
    }

    public function test_me_devolve_o_usuario_logado(): void
    {
        $usuario = $this->entrar(User::factory()->gerente()->create());

        $this->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('id', $usuario->id)
            ->assertJsonPath('perfil', 'gerente');
    }

    public function test_logout_revoga_o_token(): void
    {
        User::factory()->create(['email' => 'ana@konvex.com']);
        $token = $this->postJson('/api/auth/login', ['email' => 'ana@konvex.com', 'senha' => 'senha123'])->json('token');

        $this->withToken($token)->postJson('/api/auth/logout')->assertNoContent();

        $this->app['auth']->forgetGuards();

        $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
    }

    public function test_usuario_inativado_com_token_ativo_e_barrado(): void
    {
        $usuario = $this->entrar(User::factory()->create(['ativo' => false]));

        $this->getJson('/api/auth/me')
            ->assertForbidden()
            ->assertJsonPath('erro.codigo', 'USUARIO_INATIVO');
    }

    public function test_config_devolve_dominios_e_data_do_servidor(): void
    {
        $this->entrar(User::factory()->create());

        $this->getJson('/api/config')
            ->assertOk()
            ->assertJsonPath('hoje', '2026-10-07')
            ->assertJsonPath('perfis', ['diretor', 'gerente', 'membro'])
            ->assertJsonPath('prioridades', ['P1', 'P2', 'P3', 'P4'])
            ->assertJsonPath('tiposCapacitacao.0', ['valor' => 'mecanica', 'rotulo' => 'Mecânica'])
            ->assertJsonPath('statusTarefa', ['pendente', 'andamento', 'concluida']);
    }
}
