<?php

namespace App\Http\Resources;

class UsuarioResource extends ApiResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'email' => $this->email,
            'perfil' => $this->perfil,
            'ativo' => (bool) $this->ativo,
        ];
    }
}
