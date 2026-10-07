<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Validation\Rule;

class UsuarioRequest extends ApiRequest
{
    public function rules(): array
    {
        // E-mail duplicado é tratado no service (409), conforme o contrato.
        return [
            'nome' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'perfil' => ['required', Rule::in(User::PERFIS)],
        ];
    }
}
