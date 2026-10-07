<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

abstract class ApiRequest extends FormRequest
{
    public function authorize(): bool
    {
        // A autorização é feita pelo middleware "permissao" e pelo escopo dos repositórios.
        return true;
    }
}
