<?php

namespace App\Http\Controllers;

use App\Models\Projeto;
use App\Models\User;
use App\Services\EficienciaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EficienciaController extends ApiController
{
    public function __construct(private readonly EficienciaService $eficiencia)
    {
    }

    public function membros(Request $request): JsonResponse
    {
        $filtros = $request->validate($this->regras() + [
            'perfil' => ['nullable', Rule::in(User::PERFIS)],
            'ordenar' => ['nullable', Rule::in(['nome', 'total', 'concluidas', 'abertas', 'atrasadas', 'eficiencia'])],
            'direcao' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        return response()->json(['dados' => $this->eficiencia->membros($request->user(), $filtros)]);
    }

    public function insights(Request $request): JsonResponse
    {
        $filtros = $request->validate($this->regras());

        return response()->json($this->eficiencia->insights($request->user(), $filtros));
    }

    public function projetos(Request $request): JsonResponse
    {
        $dados = $request->validate(['status' => ['nullable', Rule::in(Projeto::STATUS)]]);

        return response()->json(['dados' => $this->eficiencia->projetos($request->user(), $dados['status'] ?? null)]);
    }

    private function regras(): array
    {
        return [
            'projetoId' => ['nullable', 'integer'],
            'de' => ['nullable', 'date_format:Y-m-d'],
            'ate' => ['nullable', 'date_format:Y-m-d'],
        ];
    }
}
