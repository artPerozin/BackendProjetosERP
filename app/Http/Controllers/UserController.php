<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Services\User\CreateOneUserService;
use App\Http\Services\User\DeleteOneUserService;
use App\Http\Services\User\GetAllUsersService;
use App\Http\Services\User\GetOneUserWithFileService;
use App\Http\Services\User\PasswordGenerationService;
use App\Http\Services\User\PasswordHashingService;
use App\Http\Services\User\UpdateOneUserService;
use App\Traits\HttpResponses;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use HttpResponses;

    protected $passwordGenerationService;
    protected $passwordHashingService;
    protected $createOneUserService;
    protected $getAllUsersService;
    protected $getOneUserWithFileService;
    protected $updateOneUserService;
    protected $deleteOneUserService;

    public function __construct(
        PasswordGenerationService $passwordGenerationService,
        PasswordHashingService $passwordHashingService,
        CreateOneUserService $createOneUserService,
        GetAllUsersService $getAllUsersService,
        GetOneUserWithFileService $getOneUserWithFileService,
        UpdateOneUserService $updateOneUserService,
        DeleteOneUserService $deleteOneUserService
    ) {
        $this->passwordGenerationService = $passwordGenerationService;
        $this->passwordHashingService = $passwordHashingService;
        $this->createOneUserService = $createOneUserService;
        $this->getAllUsersService = $getAllUsersService;
        $this->getOneUserWithFileService = $getOneUserWithFileService;
        $this->updateOneUserService = $updateOneUserService;
        $this->deleteOneUserService = $deleteOneUserService;
    }

    public function store(StoreUserRequest $request)
    {
        $body = $request->input();

        $password = $this->passwordGenerationService->handle();
        $hashedPassword = $this->passwordHashingService->handle($password);

        $user = $this->createOneUserService->handle([...$body, 'password' => $hashedPassword]);

        return $user;
    }

    public function index(Request $request)
    {
        $search = $request->input('word');

        $users = $this->getAllUsersService->handle($search);

        return $users;
    }

    public function show($id)
    {
        $user = $this->getOneUserWithFileService->handle($id);
        return $user;
    }

    public function update($id, UpdateUserRequest $request)
    {
        $user = $this->getOneUserWithFileService->handle($id);
        $body = $request->except('profile_id');

        if ($request->has('photo')) {
            if ($request->hasFile('photo')) {
                $updatedUser = $this->updateOneUserService->handle($user, $body);
                return $updatedUser;
            } else {
                $updatedUser = $this->updateOneUserService->handle($user, $body);
                return $updatedUser;
            }
        }

        $updatedUser = $this->updateOneUserService->handle($user, $body);
        return $updatedUser;
    }

    public function destroy($id)
    {
        return $this->deleteOneUserService->handle($id);
    }

    public function getImage(Request $request)
    {
        if ($request->user()->file) {
            return $request->user()->file->url;
        }
    }
}