<?php

namespace App\Http\Services\User;

use Illuminate\Support\Facades\Hash;

class PasswordHashingService
{
    public function handle($password)
    {
        return Hash::make($password);
    }
}
