<?php

namespace App\Http\Controllers;

use App\Http\Requests\CapacitacaoRequest;
use App\Http\Resources\CapacitacaoDetalheResource;
use App\Http\Resources\CapacitacaoResource;
use App\Models\Capacitacao;
use App\Services\CapacitacaoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;

class CapacitacaoController extends ApiController
{
    public function __construct(private readonly CapacitacaoService $capacitacoes)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $filtros = $request->validate([
            'mes' => ['nullable', 'date_format:Y-m'],
            'de' => ['nullable', 'date_format:Y-m-d'],
            'ate' => ['nullable', 'date_format:Y-m-d'],
            'tipo' => ['nullable', Rule::in(Capacitacao::TIPOS)],
        ]);

        return $this->colecao(CapacitacaoResource::class, $this->capacitacoes->calendario($filtros), $request);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return $this->recurso(CapacitacaoDetalheResource::class, $this->capacitacoes->detalhar($id), $request);
    }

    public function store(CapacitacaoRequest $request): JsonResponse
    {
        return $this->recurso(CapacitacaoResource::class, $this->capacitacoes->criar($request->validated()), $request, 201);
    }

    public function update(CapacitacaoRequest $request, int $id): JsonResponse
    {
        return $this->recurso(
            CapacitacaoResource::class,
            $this->capacitacoes->atualizar($id, $request->validated()),
            $request
        );
    }

    public function destroy(int $id): Response
    {
        $this->capacitacoes->excluir($id);

        return response()->noContent();
    }

    public function inscrever(Request $request, int $id): JsonResponse
    {
        $dados = $request->validate(['usuarioId' => ['nullable', 'integer', 'exists:users,id']]);

        return $this->recurso(
            CapacitacaoResource::class,
            $this->capacitacoes->inscrever($request->user(), $id, isset($dados['usuarioId']) ? (int) $dados['usuarioId'] : null),
            $request,
            201
        );
    }

    public function cancelar(Request $request, int $id, string $usuarioId): JsonResponse
    {
        $alvo = $usuarioId === 'me' ? null : (int) $usuarioId;

        return $this->recurso(
            CapacitacaoResource::class,
            $this->capacitacoes->cancelar($request->user(), $id, $alvo),
            $request
        );
    }

    public function minhas(Request $request): JsonResponse
    {
        return $this->colecao(CapacitacaoResource::class, $this->capacitacoes->minhas($request->user(), $request->query()), $request);
    }
}
