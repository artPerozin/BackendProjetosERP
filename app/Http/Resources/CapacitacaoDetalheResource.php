<?php

namespace App\Http\Resources;

class CapacitacaoDetalheResource extends CapacitacaoResource
{
    protected function incluirPerfil(): bool
    {
        return true;
    }
}
