<?php

namespace App\Services;

use App\Models\User;

/**
 * get-permissions: devolve as permissões (RBAC) de cada perfil.
 * O middleware "permissao" consulta este service; o escopo ("só as suas coisas")
 * é aplicado nos repositórios a partir das permissões "ver_todos", "ver_todas" e "ver_do_projeto".
 */
class PermissionService
{
    private const BASE = [
        'dashboard.ver',
        'projetos.ver',
        'tarefas.ver',
        'tarefas.gerenciar',          // membro: apenas tarefas em que é responsável
        'capacitacoes.ver',
        'capacitacoes.inscrever',
        'eficiencia.ver',
    ];

    public function getPermissions(?string $perfil): array
    {
        return match ($perfil) {
            User::DIRETOR => array_merge(self::BASE, [
                'usuarios.listar',
                'usuarios.gerenciar',
                'projetos.ver_todos',
                'projetos.gerenciar',
                'tarefas.ver_todas',
                'capacitacoes.gerenciar',
                'capacitacoes.inscrever_outros',
                'eficiencia.ver_todos',
            ]),
            User::GERENTE => array_merge(self::BASE, [
                'usuarios.listar',
                'projetos.gerenciar',          // apenas os seus projetos
                'tarefas.ver_do_projeto',
                'capacitacoes.gerenciar',
                'capacitacoes.inscrever_outros',
                'eficiencia.ver_do_projeto',
            ]),
            User::MEMBRO => self::BASE,
            default => [],
        };
    }

    public function temPermissao(?string $perfil, string $permissao): bool
    {
        return in_array($permissao, $this->getPermissions($perfil), true);
    }
}
