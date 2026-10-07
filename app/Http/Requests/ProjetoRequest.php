<?php

namespace App\Http\Requests;

class ProjetoRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'nome' => ['required', 'string', 'max:255'],
            'descricao' => ['nullable', 'string'],
            'inicio' => ['required', 'date_format:Y-m-d'],
            'fim' => ['required', 'date_format:Y-m-d', 'after_or_equal:inicio'],
            'membros' => ['nullable', 'array'],
            // Que os novos membros estejam ativos é verificado no ProjetoService.
            'membros.*' => ['integer', 'distinct', 'exists:users,id'],
        ];
    }
}
