<?php

namespace App\Http\Requests;

class LoginRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'senha' => ['required', 'string'],
        ];
    }
}
