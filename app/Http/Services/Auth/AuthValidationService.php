<?php

namespace App\Http\Services\Auth;

use App\Http\Repositories\AuthRepository;
use Exception;

class AuthValidationService
{
    private $authRepository;

    public function __construct(AuthRepository $authRepository) {
        $this->authRepository = $authRepository;
    }
    public function handle($credentials): bool
    {
        try {
            return $this->authRepository->attempt($credentials);
        } catch (\Throwable $e) {
            throw new Exception("Não autorizado. Credenciais incorretas: " . $e->getMessage(), 403, $e);
        }
    }
}
