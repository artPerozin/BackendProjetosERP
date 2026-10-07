<?php

namespace App\Http\Resources;

class TarefaResource extends ApiResource
{
    public function toArray($request): array
    {
        $dados = [
            'id' => $this->id,
            'projetoId' => $this->projeto_id,
            'titulo' => $this->titulo,
            'prioridade' => $this->prioridade,
            'responsaveis' => $this->responsaveis
                ->map(fn ($u) => ['id' => $u->id, 'nome' => $u->nome])
                ->values()
                ->all(),
            'inicio' => $this->inicio->format('Y-m-d'),
            'fim' => $this->fim->format('Y-m-d'),
            'status' => $this->status,
            'conclusao' => $this->conclusao?->format('Y-m-d'),
            'atrasada' => $this->atrasada,
            'coluna' => $this->coluna,
        ];

        if ($this->relationLoaded('projeto')) {
            $dados['projetoNome'] = $this->projeto?->nome;
        }

        return $dados;
    }
}
