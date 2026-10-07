<?php

namespace App\Exceptions;

use App\Traits\HttpResponses;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class Handler extends ExceptionHandler
{
    use HttpResponses;
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    public function render($request, Throwable $e): Response
    {
        if ($e instanceof \Illuminate\Validation\ValidationException) {
            return $this->error($e->getMessage(), Response::HTTP_BAD_REQUEST);
        }

        if ($e instanceof AuthorizationException) {
            return response()->json(['message' => 'Acesso negado. Você não possui permissão para executar esta ação.'], 403);
        }

        return parent::render($request, $e);
    }
}
