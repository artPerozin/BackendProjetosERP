<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProjetoRequest;
use App\Http\Resources\ProjetoResource;
use App\Models\Projeto;
use App\Services\ProjetoService;
use App\Support\Paginacao;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class ProjetoController extends ApiController
{
    public function __construct(private readonly ProjetoService $projetos)
    {
    }

    public function index(Request $request): JsonResponse
    {
        return Paginacao::resposta(
            $this->projetos->listar($request->user(), $request->query()),
            ProjetoResource::class,
            $request
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->recurso(ProjetoResource::class, $this->projetos->detalhar($request->user(), $id), $request);
    }

    public function store(ProjetoRequest $request): JsonResponse
    {
        return $this->recurso(
            ProjetoResource::class,
            $this->projetos->criar($request->user(), $request->validated()),
            $request,
            201
        );
    }

    public function update(ProjetoRequest $request, int $id): JsonResponse
    {
        return $this->recurso(
            ProjetoResource::class,
            $this->projetos->atualizar($request->user(), $id, $request->validated()),
            $request
        );
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $dados = $request->validate(['status' => ['required', Rule::in(Projeto::STATUS)]]);

        return $this->recurso(
            ProjetoResource::class,
            $this->projetos->alterarStatus($request->user(), $id, $dados['status']),
            $request
        );
    }

    public function destroy(Request $request, int $id): Response
    {
        $this->projetos->excluir($request->user(), $id);

        return response()->noContent();
    }
}
