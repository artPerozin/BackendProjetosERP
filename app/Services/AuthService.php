<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Repositories\UsuarioRepository;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

class AuthService
{
    public function __construct(private readonly UsuarioRepository $usuarios)
    {
    }

    public function login(string $email, string $senha): array
    {
        $usuario = $this->usuarios->encontrarPorEmail($email);

        if (! $usuario || ! Hash::check($senha, $usuario->password)) {
            throw new ApiException('CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.', 401);
        }

        if (! $usuario->ativo) {
            throw new ApiException('USUARIO_INATIVO', 'Usuário inativo.', 403);
        }

        $expiraEm = now()->addMinutes(config('konvex.token_minutos'));
        $token = $usuario->createToken('api', ['*'], $expiraEm);

        return [
            'token' => $token->plainTextToken,
            'expiraEm' => $expiraEm->toIso8601String(),
            'usuario' => $usuario,
        ];
    }

    public function logout(User $usuario): void
    {
        $token = $usuario->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }
    }
}
