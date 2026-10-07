<?php

namespace App\Http\Services\Auth;

use App\Http\Repositories\AuthRepository;
use Illuminate\Http\Request;

class GetProfileService
{
    private $authRepository;
    
    public function __construct(AuthRepository $authRepository)
    {
        $this->authRepository = $authRepository;
    }

    public function handle(Request $request)
    {
        return $this->authRepository->findProfileById($request->user()->profile_id);
    }
}