<?php

namespace App\Exceptions;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Padroniza todos os erros da API no formato { "erro": { "codigo", "mensagem", "campos" } }.
 * Registrado em bootstrap/app.php (ver docs/INSTALACAO.md).
 */
class TratadorDeExcecoes
{
    public static function registrar(Exceptions $exceptions): void
    {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request, $e) => $request->is('api/*') || $request->expectsJson()
        );

        $exceptions->render(fn (ApiException $e, Request $r) => response()->json($e->corpo(), $e->status));

        $exceptions->render(function (ValidationException $e, Request $r) {
            $campos = collect($e->errors())->map(fn ($mensagens) => $mensagens[0])->all();

            return self::erro('VALIDACAO', 'Dados inválidos.', 422, $campos);
        });

        $exceptions->render(fn (AuthenticationException $e, Request $r) => self::erro(
            'NAO_AUTENTICADO', 'Não autenticado.', 401
        ));

        $exceptions->render(fn (AuthorizationException $e, Request $r) => self::erro(
            'SEM_PERMISSAO', 'Você não tem permissão para realizar esta ação.', 403
        ));

        $exceptions->render(fn (AccessDeniedHttpException $e, Request $r) => self::erro(
            'SEM_PERMISSAO', 'Você não tem permissão para realizar esta ação.', 403
        ));

        $exceptions->render(fn (ModelNotFoundException $e, Request $r) => self::erro(
            'NAO_ENCONTRADO', 'Registro não encontrado.', 404
        ));

        $exceptions->render(fn (NotFoundHttpException $e, Request $r) => self::erro(
            'NAO_ENCONTRADO', 'Recurso não encontrado.', 404
        ));

        $exceptions->render(function (HttpExceptionInterface $e, Request $r) {
            if ($e->getStatusCode() >= 500) {
                return null;
            }

            return self::erro('REQUISICAO_INVALIDA', $e->getMessage() ?: 'Requisição inválida.', $e->getStatusCode());
        });
    }

    private static function erro(string $codigo, string $mensagem, int $status, array $campos = []): JsonResponse
    {
        $erro = ['codigo' => $codigo, 'mensagem' => $mensagem];

        if ($campos !== []) {
            $erro['campos'] = $campos;
        }

        return response()->json(['erro' => $erro], $status);
    }
}
