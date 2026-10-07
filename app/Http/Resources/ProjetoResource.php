<?php

namespace App\Http\Resources;

class ProjetoResource extends ApiResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'descricao' => $this->descricao,
            'inicio' => $this->inicio->format('Y-m-d'),
            'fim' => $this->fim->format('Y-m-d'),
            'status' => $this->status,
            'membros' => $this->membros
                ->map(fn ($m) => ['id' => $m->id, 'nome' => $m->nome, 'perfil' => $m->perfil])
                ->values()
                ->all(),
            'progresso' => $this->progresso,
        ];
    }
}
