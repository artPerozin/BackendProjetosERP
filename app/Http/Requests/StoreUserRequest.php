<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    protected $stopOnFirstFailure = true;

    public function authorize(): bool
    {
        return Auth::check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255|regex:/^[\p{L}\s]+$/u',
            'email' => 'required|string|email|max:255|unique:users',
            'profile_id' => 'required|integer|in:2,3,4',
            'photo' => 'file|mimes:jpeg,png,jpg,gif,svg',
        ];
    }
    public function messages(): array
    {
        return [
            'name.required' => 'O campo name é obrigatório',
            'name.string' => 'O campo name deve ser uma string válida',
            // Como o Laravel converte automaticamente os campos enviados como multipart/form-data em strings,
            // é necessário adicionar uma validação extra com regex para garantir que o campo 'name'
            //contenha apenas caracteres válidos para uma string.
            'name.regex' => 'O campo name deve ser uma string válida',
            'name.max' => 'O campo name deve ter no máximo 255 caracteres',
            'email.string' => 'O campo email deve ser uma string',
            'email.required' => 'O campo email é obrigatório',
            'email.email' => 'O campo email deve conter um email válido',
            'email.max' => 'O campo email deve ter no máximo 255 caracteres',
            'email.unique' => 'Este email já foi cadastrado',
            'profile_id.integer' => 'O campo profile_id deve ser um inteiro',
            'profile_id.required' => 'O campo profile_id é obrigatório',
            'profile_id.in' => 'O campo profile_id aceita os valores: 2 (RECEPCIONISTA), 3 (INSTRUTOR) ou 4 (NUTRICIONISTA).',
            'photo.file' => 'O campo photo deve ser um arquivo',
            'photo.mimes' => 'O campo photo deve ser um arquivo do tipo: jpeg, png, jpg, gif, svg',
        ];
    }
}
