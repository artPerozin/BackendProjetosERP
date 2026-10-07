<?php

namespace App\Repositories;

use App\Models\Capacitacao;
use App\Models\User;
use App\Support\Data;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

class CapacitacaoRepository
{
    public function calendario(array $filtros): Collection
    {
        $consulta = Capacitacao::query()->with('inscritos');

        if (! empty($filtros['mes']) && preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $filtros['mes'])) {
            $inicio = Carbon::parse($filtros['mes'].'-01', Data::FUSO);
            $consulta->whereBetween('data', [$inicio->toDateString(), $inicio->copy()->endOfMonth()->toDateString()]);
        } else {
            $consulta
                ->when(! empty($filtros['de']), fn ($q) => $q->where('data', '>=', $filtros['de']))
                ->when(! empty($filtros['ate']), fn ($q) => $q->where('data', '<=', $filtros['ate']));
        }

        if (! empty($filtros['tipo'])) {
            $consulta->where('tipo', $filtros['tipo']);
        }

        return $consulta->orderBy('data')->orderBy('hora')->orderBy('id')->get();
    }

    public function encontrarOuFalhar(int $id): Capacitacao
    {
        return Capacitacao::with('inscritos')->findOrFail($id);
    }

    public function criar(array $dados): Capacitacao
    {
        return $this->encontrarOuFalhar(Capacitacao::create($dados)->id);
    }

    public function atualizar(Capacitacao $capacitacao, array $dados): Capacitacao
    {
        $capacitacao->update($dados);

        return $this->encontrarOuFalhar($capacitacao->id);
    }

    public function excluir(Capacitacao $capacitacao): void
    {
        $capacitacao->inscritos()->detach();
        $capacitacao->delete();
    }

    public function minhas(User $usuario, bool $futuras, int $limite): Collection
    {
        return Capacitacao::query()
            ->whereHas('inscritos', fn ($i) => $i->where('users.id', $usuario->id))
            ->when($futuras, fn ($q) => $q->where('data', '>=', Data::hoje()->toDateString()))
            ->with('inscritos')
            ->orderBy('data')
            ->orderBy('hora')
            ->limit($limite)
            ->get();
    }

    /** Trava a linha da capacitação para evitar inscrições simultâneas além das vagas. */
    public function travarOuFalhar(int $id): Capacitacao
    {
        return Capacitacao::lockForUpdate()->findOrFail($id);
    }

    public function totalInscritos(Capacitacao $capacitacao): int
    {
        return $capacitacao->inscritos()->count();
    }

    public function estaInscrito(Capacitacao $capacitacao, int $usuarioId): bool
    {
        return $capacitacao->inscritos()->where('users.id', $usuarioId)->exists();
    }

    public function inscrever(Capacitacao $capacitacao, int $usuarioId): void
    {
        $capacitacao->inscritos()->attach($usuarioId);
    }

    public function cancelar(Capacitacao $capacitacao, int $usuarioId): void
    {
        $capacitacao->inscritos()->detach($usuarioId);
    }
}
