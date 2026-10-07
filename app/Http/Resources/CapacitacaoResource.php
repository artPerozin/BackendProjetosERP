<?php

namespace App\Http\Resources;

class CapacitacaoResource extends ApiResource
{
    /** Na rota de detalhe os inscritos trazem também o perfil (ver CapacitacaoDetalheResource). */
    protected function incluirPerfil(): bool
    {
        return false;
    }

    public function toArray($request): array
    {
        $logado = $request->user()?->id;
        $inscritos = $this->inscritos;

        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'tipo' => $this->tipo,
            'data' => $this->data->format('Y-m-d'),
            'hora' => $this->hora,
            'sala' => $this->sala,
            'instrutor' => $this->instrutor,
            'vagas' => $this->vagas,
            'inscritos' => $inscritos->map(function ($u) {
                $item = ['id' => $u->id, 'nome' => $u->nome];

                if ($this->incluirPerfil()) {
                    $item['perfil'] = $u->perfil;
                }

                return $item;
            })->values()->all(),
            'vagasRestantes' => max(0, $this->vagas - $inscritos->count()),
            'inscrito' => $logado !== null && $inscritos->contains('id', $logado),
        ];
    }
}
