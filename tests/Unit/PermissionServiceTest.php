<?php

namespace Tests\Unit;

use App\Services\PermissionService;
use PHPUnit\Framework\TestCase;

class PermissionServiceTest extends TestCase
{
    private PermissionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PermissionService();
    }

    public function test_diretor_possui_permissoes_administrativas(): void
    {
        $permissoes = $this->service->getPermissions('diretor');

        foreach (['usuarios.gerenciar', 'projetos.ver_todos', 'tarefas.ver_todas', 'eficiencia.ver_todos', 'capacitacoes.gerenciar'] as $p) {
            $this->assertContains($p, $permissoes);
        }
    }

    public function test_gerente_nao_gerencia_usuarios_nem_ve_todos_os_projetos(): void
    {
        $permissoes = $this->service->getPermissions('gerente');

        $this->assertContains('projetos.gerenciar', $permissoes);
        $this->assertContains('capacitacoes.inscrever_outros', $permissoes);
        $this->assertNotContains('usuarios.gerenciar', $permissoes);
        $this->assertNotContains('projetos.ver_todos', $permissoes);
    }

    public function test_membro_so_possui_permissoes_basicas(): void
    {
        $permissoes = $this->service->getPermissions('membro');

        $this->assertContains('projetos.ver', $permissoes);
        $this->assertContains('capacitacoes.inscrever', $permissoes);
        $this->assertNotContains('projetos.gerenciar', $permissoes);
        $this->assertNotContains('usuarios.listar', $permissoes);
        $this->assertNotContains('capacitacoes.gerenciar', $permissoes);
        $this->assertNotContains('capacitacoes.inscrever_outros', $permissoes);
    }

    public function test_perfil_desconhecido_nao_possui_permissoes(): void
    {
        $this->assertSame([], $this->service->getPermissions('estagiario'));
        $this->assertSame([], $this->service->getPermissions(null));
        $this->assertFalse($this->service->temPermissao('estagiario', 'projetos.ver'));
    }
}
