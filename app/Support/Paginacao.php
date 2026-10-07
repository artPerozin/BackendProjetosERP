<?php

namespace App\Support;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class Paginacao
{
    public static function limite(mixed $valor, int $padrao = 20): int
    {
        $limite = (int) ($valor ?: $padrao);

        return max(1, min(100, $limite));
    }

    public static function pagina(mixed $valor): int
    {
        return max(1, (int) ($valor ?: 1));
    }

    /** Formato { dados, total, pagina, limite } */
    public static function resposta(LengthAwarePaginator $paginador, string $resource, Request $request): JsonResponse
    {
        $dados = $paginador->getCollection()
            ->map(fn ($item) => (new $resource($item))->resolve($request))
            ->values()
            ->all();

        return response()->json([
            'dados' => $dados,
            'total' => $paginador->total(),
            'pagina' => $paginador->currentPage(),
            'limite' => $paginador->perPage(),
        ]);
    }
}
