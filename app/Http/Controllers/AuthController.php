<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Repositories\AuthRepository;
use App\Http\Requests\AuthRequest;
use App\Http\Services\Auth\AuthValidationService;
use App\Http\Services\Auth\GetPermissionsService;
use App\Http\Services\Auth\TokenRevocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * @var TokenRevocationService
     */
    private $tokenRevocationService;

    /**
     * @var GetPermissionsService
     */
    private $getPermissionsService;

    /**
     * @var AuthValidationService
     */
    private $authValidationService;

    public function __construct(
        TokenRevocationService $tokenRevocationService,
        GetPermissionsService $getPermissionsService,
        AuthValidationService $authValidationService
    ) {
        $this->tokenRevocationService = $tokenRevocationService;
        $this->getPermissionsService = $getPermissionsService;
        $this->authValidationService = $authValidationService;
    }
    
    public function login(AuthRequest $request): JsonResponse
    {
        try {
            $credentials = $request->only('email', 'password');
            $isAuthenticated = $this->authValidationService->handle($credentials);
            if($isAuthenticated){
                $user = $request->user();
                $this->tokenRevocationService->handle($user);
            }
            $profile = $user->profile();
            $permissionsUser = $this->getPermissionsService->handle($user->profile()->name);;
            $token = $user->createToken($permissionsUser)->plainTextToken;
            return $this->response('Autorizado', Response::HTTP_OK, [
                'name' => $user->name,
                'profile' => $profile->name,
                'permissions' => $permissionsUser,
                'token' => $token
            ]);
        } catch (\Throwable $error) {
            return $this->error('Erro ao tentar fazer logout.', 500, ['exception' => $error->getMessage()]);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $this->tokenRevocationService->handle($user);
            return $this->success('Logout realizado com sucesso.');
        } catch (\Throwable $error) {
            return $this->error('Erro ao tentar fazer logout.', 500, ['exception' => $error->getMessage()]);
        }
    }
    
}
