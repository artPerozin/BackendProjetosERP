<?php

namespace App\Http\Controllers;

use App\Http\Requests\UsuarioRequest;
use App\Http\Resources\UsuarioResource;
use App\Models\User;
use App\Services\UsuarioService;
use App\Support\Paginacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UsuarioController extends ApiController
{
    public function __construct(private readonly UsuarioService $usuarios)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return Paginacao::resposta($this->usuarios->listar($request->query()), UsuarioResource::class, $request);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->recurso(UsuarioResource::class, $this->usuarios->detalhar($request->user(), $id), $request);
    }

    public function store(UsuarioRequest $request): JsonResponse
    {
        return $this->recurso(UsuarioResource::class, $this->usuarios->criar($request->validated()), $request, 201);
    }

    public function update(UsuarioRequest $request, int $id): JsonResponse
    {
        $usuario = $this->usuarios->atualizar($request->user(), $id, $request->validated());

        return $this->recurso(UsuarioResource::class, $usuario, $request);
    }

    public function perfil(Request $request, int $id): JsonResponse
    {
        $dados = $request->validate(['perfil' => ['required', Rule::in(User::PERFIS)]]);

        return $this->recurso(
            UsuarioResource::class,
            $this->usuarios->definirPerfil($request->user(), $id, $dados['perfil']),
            $request
        );
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $dados = $request->validate(['ativo' => ['required', 'boolean']]);

        return $this->recurso(
            UsuarioResource::class,
            $this->usuarios->definirStatus($request->user(), $id, (bool) $dados['ativo']),
            $request
        );
    }
}
