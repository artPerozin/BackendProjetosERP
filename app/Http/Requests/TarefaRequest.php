<?php

namespace App\Http\Requests;

use App\Models\Tarefa;
use Illuminate\Validation\Rule;

class TarefaRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'titulo' => ['required', 'string', 'max:255'],
            'prioridade' => ['required', Rule::in(Tarefa::PRIORIDADES)],
            'responsaveis' => ['nullable', 'array'],
            'responsaveis.*' => ['integer', 'distinct', 'exists:users,id'],
            'inicio' => ['required', 'date_format:Y-m-d'],
            'fim' => ['required', 'date_format:Y-m-d', 'after_or_equal:inicio'],
        ];
    }
}
