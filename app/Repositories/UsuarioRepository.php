<?php

namespace App\Repositories;

use App\Models\User;
use App\Support\Paginacao;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class UsuarioRepository
{
    private const ORDENAVEIS = ['nome', 'email', 'perfil', 'ativo'];

    public function paginar(array $filtros): LengthAwarePaginator
    {
        $consulta = User::query();

        if (! empty($filtros['q'])) {
            $termo = '%'.$filtros['q'].'%';
            $consulta->where(fn ($w) => $w->where('nome', 'like', $termo)->orWhere('email', 'like', $termo));
        }

        if (! empty($filtros['perfil'])) {
            $consulta->where('perfil', $filtros['perfil']);
        }

        if (isset($filtros['ativo']) && $filtros['ativo'] !== '') {
            $ativo = filter_var($filtros['ativo'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($ativo !== null) {
                $consulta->where('ativo', $ativo);
            }
        }

        $coluna = in_array($filtros['ordenar'] ?? null, self::ORDENAVEIS, true) ? $filtros['ordenar'] : 'nome';
        $direcao = strtolower($filtros['direcao'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        return $consulta
            ->orderBy($coluna, $direcao)
            ->orderBy('id')
            ->paginate(
                Paginacao::limite($filtros['limite'] ?? null),
                ['*'],
                'page',
                Paginacao::pagina($filtros['pagina'] ?? null)
            );
    }

    public function encontrarOuFalhar(int $id): User
    {
        return User::findOrFail($id);
    }

    public function encontrarPorEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function emailEmUso(string $email, ?int $ignorarId = null): bool
    {
        return User::where('email', $email)
            ->when($ignorarId, fn ($q) => $q->where('id', '!=', $ignorarId))
            ->exists();
    }

    public function criar(array $dados): User
    {
        return User::create($dados);
    }

    public function atualizar(User $usuario, array $dados): User
    {
        $usuario->update($dados);

        return $usuario->refresh();
    }

    public function ativosPorIds(array $ids): Collection
    {
        return User::whereIn('id', $ids)->where('ativo', true)->get();
    }
}
