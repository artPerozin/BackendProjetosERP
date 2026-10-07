<?php

namespace App\Http\Services\Auth;

use App\Models\User;
use Exception;

class TokenRevocationService
{
    public function handle(User $user): void
    {
        try {
            $user->tokens()->delete();
        } catch (\Throwable $e) {
            throw new Exception("Falha ao revogar tokens: " . $e->getMessage(), 500, $e);
        }
    }
}
