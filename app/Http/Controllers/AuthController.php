<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\Capacitacao;
use App\Models\Tarefa;
use App\Models\User;
use App\Services\AuthService;
use App\Support\Data;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class AuthController extends ApiController
{
    public function __construct(private readonly AuthService $auth)
    {
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $resultado = $this->auth->login($request->validated('email'), $request->validated('senha'));

        return response()->json([
            'token' => $resultado['token'],
            'expiraEm' => $resultado['expiraEm'],
            'usuario' => (new UsuarioResource($resultado['usuario']))->resolve($request),
        ]);
    }

    public function logout(Request $request): Response
    {
        $this->auth->logout($request->user());

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return $this->recurso(UsuarioResource::class, $request->user(), $request);
    }

    /** Domínios e data do servidor. */
    public function config(): JsonResponse
    {
        return response()->json([
            'hoje' => Data::hoje()->toDateString(),
            'perfis' => User::PERFIS,
            'prioridades' => Tarefa::PRIORIDADES,
            'tiposCapacitacao' => collect(Capacitacao::ROTULOS)
                ->map(fn ($rotulo, $valor) => ['valor' => $valor, 'rotulo' => $rotulo])
                ->values()
                ->all(),
            'statusTarefa' => Tarefa::STATUS,
        ]);
    }
}
