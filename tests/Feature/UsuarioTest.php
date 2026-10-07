<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class UsuarioTest extends TestCase
{
    use RefreshDatabase, PreparaCenario;

    public function test_diretor_lista_com_paginacao_busca_e_filtros(): void
    {
        $this->entrar(User::factory()->diretor()->create(['nome' => 'Diretor']));
        User::factory()->gerente()->count(2)->create(['nome' => 'Gerente']);
        User::factory()->create(['nome' => 'Zeca Silva']);

        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonPath('total', 4)
            ->assertJsonPath('pagina', 1)
            ->assertJsonPath('limite', 20);

        $this->getJson('/api/users?perfil=gerente')->assertJsonPath('total', 2);
        $this->getJson('/api/users?q=zeca')->assertJsonPath('total', 1)->assertJsonPath('dados.0.nome', 'Zeca Silva');
        $this->getJson('/api/users?limite=2&pagina=2')->assertJsonPath('pagina', 2)->assertJsonCount(2, 'dados');
        $this->getJson('/api/users?ordenar=nome&direcao=desc')->assertJsonPath('dados.0.nome', 'Zeca Silva');
    }

    public function test_filtro_de_ativos_para_seletores(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        User::factory()->inativo()->create();

        $this->getJson('/api/users?ativo=true&limite=100')->assertJsonPath('total', 1);
        $this->getJson('/api/users?ativo=false')->assertJsonPath('total', 1);
    }

    public function test_gerente_lista_mas_nao_cadastra(): void
    {
        $this->entrar(User::factory()->gerente()->create());

        $this->getJson('/api/users')->assertOk();
        $this->postJson('/api/users', ['nome' => 'X', 'email' => 'x@x.com', 'perfil' => 'membro'])
            ->assertForbidden()
            ->assertJsonPath('erro.codigo', 'SEM_PERMISSAO');
    }

    public function test_membro_nao_lista_usuarios_mas_consulta_o_proprio(): void
    {
        $membro = $this->entrar(User::factory()->create());
        $outro = User::factory()->create();

        $this->getJson('/api/users')->assertForbidden();
        $this->getJson("/api/users/{$membro->id}")->assertOk()->assertJsonPath('id', $membro->id);
        $this->getJson("/api/users/{$outro->id}")->assertForbidden();
    }

    public function test_detalhe_inexistente_devolve_404(): void
    {
        $this->entrar(User::factory()->diretor()->create());

        $this->getJson('/api/users/9999')->assertNotFound()->assertJsonPath('erro.codigo', 'NAO_ENCONTRADO');
    }

    public function test_diretor_cadastra_usuario_ativo_com_senha_inicial(): void
    {
        $this->entrar(User::factory()->diretor()->create());

        $this->postJson('/api/users', ['nome' => 'Bia', 'email' => 'bia@konvex.com', 'perfil' => 'gerente'])
            ->assertCreated()
            ->assertJsonPath('ativo', true)
            ->assertJsonPath('perfil', 'gerente');

        $this->postJson('/api/auth/login', ['email' => 'bia@konvex.com', 'senha' => config('konvex.senha_inicial')])
            ->assertOk();
    }

    public function test_email_duplicado_devolve_409(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        User::factory()->create(['email' => 'bia@konvex.com']);

        $this->postJson('/api/users', ['nome' => 'Bia', 'email' => 'bia@konvex.com', 'perfil' => 'membro'])
            ->assertStatus(409)
            ->assertJsonPath('erro.campos.email', 'já cadastrado');
    }

    public function test_campos_invalidos_devolvem_422(): void
    {
        $this->entrar(User::factory()->diretor()->create());

        $this->postJson('/api/users', ['nome' => '', 'email' => 'invalido', 'perfil' => 'chefe'])
            ->assertStatus(422)
            ->assertJsonStructure(['erro' => ['campos' => ['nome', 'email', 'perfil']]]);
    }

    public function test_diretor_edita_usuario(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $alvo = User::factory()->create(['email' => 'a@a.com']);

        $this->putJson("/api/users/{$alvo->id}", ['nome' => 'Novo Nome', 'email' => 'a@a.com', 'perfil' => 'gerente'])
            ->assertOk()
            ->assertJsonPath('nome', 'Novo Nome')
            ->assertJsonPath('perfil', 'gerente');
    }

    public function test_edicao_com_email_de_outro_usuario_devolve_409(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        User::factory()->create(['email' => 'ocupado@a.com']);
        $alvo = User::factory()->create();

        $this->putJson("/api/users/{$alvo->id}", ['nome' => 'N', 'email' => 'ocupado@a.com', 'perfil' => 'membro'])
            ->assertStatus(409);
    }

    public function test_define_perfil_inline(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $alvo = User::factory()->create();

        $this->patchJson("/api/users/{$alvo->id}/perfil", ['perfil' => 'gerente'])
            ->assertOk()
            ->assertJsonPath('perfil', 'gerente');

        $this->patchJson("/api/users/{$alvo->id}/perfil", ['perfil' => 'invalido'])->assertStatus(422);
    }

    public function test_diretor_nao_altera_o_proprio_perfil(): void
    {
        $diretor = $this->entrar(User::factory()->diretor()->create());

        $this->patchJson("/api/users/{$diretor->id}/perfil", ['perfil' => 'membro'])->assertStatus(409);
    }

    public function test_inativar_revoga_tokens_e_impede_login(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $alvo = User::factory()->create(['email' => 'alvo@a.com']);
        $alvo->createToken('api');

        $this->patchJson("/api/users/{$alvo->id}/status", ['ativo' => false])
            ->assertOk()
            ->assertJsonPath('ativo', false);

        $this->assertSame(0, $alvo->tokens()->count());
        $this->postJson('/api/auth/login', ['email' => 'alvo@a.com', 'senha' => 'senha123'])->assertForbidden();
    }

    public function test_reativar_usuario(): void
    {
        $this->entrar(User::factory()->diretor()->create());
        $alvo = User::factory()->inativo()->create();

        $this->patchJson("/api/users/{$alvo->id}/status", ['ativo' => true])->assertOk()->assertJsonPath('ativo', true);
    }

    public function test_nao_e_possivel_inativar_o_proprio_usuario(): void
    {
        $diretor = $this->entrar(User::factory()->diretor()->create());

        $this->patchJson("/api/users/{$diretor->id}/status", ['ativo' => false])->assertStatus(409);
    }

    public function test_apenas_diretor_gerencia_usuarios(): void
    {
        $alvo = User::factory()->create();

        foreach ([User::factory()->gerente()->create(), User::factory()->create()] as $ator) {
            $this->entrar($ator);
            $this->putJson("/api/users/{$alvo->id}", ['nome' => 'N', 'email' => 'n@n.com', 'perfil' => 'membro'])->assertForbidden();
            $this->patchJson("/api/users/{$alvo->id}/perfil", ['perfil' => 'gerente'])->assertForbidden();
            $this->patchJson("/api/users/{$alvo->id}/status", ['ativo' => false])->assertForbidden();
        }
    }
}
