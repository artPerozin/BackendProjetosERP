<?php

namespace App\Http\Repositories;

use App\Interfaces\AuthRepositoryInterface;
use App\Models\Profile;
use Illuminate\Support\Facades\Auth;

class AuthRepository implements AuthRepositoryInterface
{

    public function attempt($data)
    {
        return Auth::attempt($data);
    }

    public function findProfileById($profileId)
    {
        return Profile::find($profileId);
    }

}
