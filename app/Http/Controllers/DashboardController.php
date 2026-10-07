<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends ApiController
{
    public function __construct(private readonly DashboardService $dashboard)
    {
    }

    public function summary(Request $request): JsonResponse
    {
        return response()->json($this->dashboard->resumo($request->user(), $this->projetoId($request)));
    }

    public function burndown(Request $request): JsonResponse
    {
        return response()->json($this->dashboard->burndown($request->user(), $this->projetoId($request)));
    }

    private function projetoId(Request $request): ?int
    {
        $dados = $request->validate(['projetoId' => ['nullable', 'integer']]);

        return isset($dados['projetoId']) ? (int) $dados['projetoId'] : null;
    }
}
