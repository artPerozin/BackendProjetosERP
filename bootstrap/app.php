<?php

use App\Exceptions\TratadorDeExcecoes;
use App\Http\Middleware\VerificaPermissao;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // RBAC: ->middleware('permissao:projetos.gerenciar')
        $middleware->alias([
            'permissao' => VerificaPermissao::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Erros da API no formato { "erro": { "codigo", "mensagem", "campos" } }
        TratadorDeExcecoes::registrar($exceptions);
    })
    ->create();
