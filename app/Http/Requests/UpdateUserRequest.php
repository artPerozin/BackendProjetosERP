<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class UpdateUserRequest extends FormRequest
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
            'name' => 'string|max:255|regex:/^[\p{L}\s]+$/u',
            'email' => "string|email|max:255|unique:users,email,{$this->route('id')}",
            'photo' => 'exclude_if:photo,null|nullable|file|mimes:jpeg,png,jpg,gif,svg',
        ];
    }
    public function messages(): array
    {
        return [
            'name.string' => 'O campo name deve ser uma string válida',
            // Como o Laravel converte automaticamente os campos enviados como multipart/form-data em strings,
            // é necessário adicionar uma validação extra com regex para garantir que o campo 'name'
            //contenha apenas caracteres válidos para uma string.
            'name.regex' => 'O campo name deve ser uma string válida',
            'name.max' => 'O campo name deve ter no máximo 255 caracteres',
            'email.string' => 'O campo email deve ser uma string',
            'email.email' => 'O campo email deve conter um email válido',
            'email.max' => 'O campo email deve ter no máximo 255 caracteres',
            'email.unique' => 'Este email já foi cadastrado',
            'photo.file' => 'O campo photo deve ser um arquivo',
            'photo.mimes' => 'O campo photo deve ser um arquivo do tipo: jpeg, png, jpg, gif, svg',
        ];
    }
}
