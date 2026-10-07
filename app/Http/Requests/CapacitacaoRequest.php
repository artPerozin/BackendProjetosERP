<?php

namespace App\Http\Requests;

use App\Models\Capacitacao;
use Illuminate\Validation\Rule;

class CapacitacaoRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'tipo' => ['required', Rule::in(Capacitacao::TIPOS)],
            'data' => ['required', 'date_format:Y-m-d'],
            'hora' => ['required', 'date_format:H:i'],
            'sala' => ['required', 'string', 'max:255'],
            'instrutor' => ['required', 'string', 'max:255'],
            'vagas' => ['required', 'integer', 'min:1'],
        ];
    }
}
