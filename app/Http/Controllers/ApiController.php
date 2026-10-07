<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

abstract class ApiController extends Controller
{
    protected function recurso(string $resource, mixed $modelo, Request $request, int $status = 200): JsonResponse
    {
        return response()->json((new $resource($modelo))->resolve($request), $status);
    }

    protected function colecao(string $resource, iterable $itens, Request $request, array $extra = []): JsonResponse
    {
        $dados = collect($itens)
            ->map(fn ($item) => (new $resource($item))->resolve($request))
            ->values()
            ->all();

        return response()->json(['dados' => $dados] + $extra);
    }
}
