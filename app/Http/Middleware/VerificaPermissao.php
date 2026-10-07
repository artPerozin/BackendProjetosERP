<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use App\Services\PermissionService;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * RBAC sobre o Sanctum. Uso: ->middleware('permissao:projetos.gerenciar')
 * Sem parâmetros apenas garante que o usuário autenticado está ativo.
 * Com vários parâmetros basta ter uma das permissões.
 */
class VerificaPermissao
{
    public function __construct(private readonly PermissionService $permissoes)
    {
    }

    public function handle(Request $request, Closure $next, string ...$exigidas): Response
    {
        $usuario = $request->user();

        if (! $usuario) {
            throw new AuthenticationException();
        }

        if (! $usuario->ativo) {
            throw new ApiException('USUARIO_INATIVO', 'Usuário inativo.', 403);
        }

        if ($exigidas === []) {
            return $next($request);
        }

        $concedidas = $this->permissoes->getPermissions($usuario->perfil);

        if (array_intersect($exigidas, $concedidas) === []) {
            throw ApiException::semPermissao();
        }

        return $next($request);
    }
}
