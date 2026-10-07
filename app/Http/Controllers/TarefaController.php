<?php

namespace App\Http\Controllers;

use App\Http\Requests\TarefaRequest;
use App\Http\Resources\TarefaResource;
use App\Models\Tarefa;
use App\Services\TarefaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class TarefaController extends ApiController
{
    public function __construct(private readonly TarefaService $tarefas)
    {
    }

    public function doProjeto(Request $request, int $id): JsonResponse
    {
        $filtros = $request->validate([
            'status' => ['nullable', Rule::in(Tarefa::STATUS)],
            'responsavel' => ['nullable', 'integer'],
            'prioridade' => ['nullable', Rule::in(Tarefa::PRIORIDADES)],
        ]);

        [$tarefas, $periodo] = $this->tarefas->listarDoProjeto($request->user(), $id, $filtros);

        return $this->colecao(TarefaResource::class, $tarefas, $request, ['periodo' => $periodo]);
    }

    public function store(TarefaRequest $request, int $id): JsonResponse
    {
        return $this->recurso(
            TarefaResource::class,
            $this->tarefas->criar($request->user(), $id, $request->validated()),
            $request,
            201
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->recurso(TarefaResource::class, $this->tarefas->detalhar($request->user(), $id), $request);
    }

    public function update(TarefaRequest $request, int $id): JsonResponse
    {
        return $this->recurso(
            TarefaResource::class,
            $this->tarefas->atualizar($request->user(), $id, $request->validated()),
            $request
        );
    }

    public function status(Request $request, int $id): JsonResponse
    {
        $dados = $request->validate(['status' => ['required', Rule::in(Tarefa::STATUS)]]);

        return $this->recurso(
            TarefaResource::class,
            $this->tarefas->alterarStatus($request->user(), $id, $dados['status']),
            $request
        );
    }

    public function mover(Request $request, int $id): JsonResponse
    {
        $dados = $request->validate(['coluna' => ['required', 'integer', 'between:0,3']]);

        return $this->recurso(
            TarefaResource::class,
            $this->tarefas->mover($request->user(), $id, (int) $dados['coluna']),
            $request
        );
    }

    public function destroy(Request $request, int $id): Response
    {
        $this->tarefas->excluir($request->user(), $id);

        return response()->noContent();
    }

    public function minhas(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'status' => ['nullable', Rule::in(['abertas', 'todas'])],
            'limite' => ['nullable', 'integer', 'min:1'],
        ]);

        return $this->colecao(TarefaResource::class, $this->tarefas->minhas($request->user(), $filtros), $request);
    }
}
