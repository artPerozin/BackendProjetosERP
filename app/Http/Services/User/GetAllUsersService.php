<?php

namespace App\Http\Services\User;

use App\Http\Repositories\UserRepository;
use App\Traits\HttpResponses;

class GetAllUsersService
{
    use HttpResponses;

    private $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function handle($search)
    {

        $users = $this->userRepository->getAll($search);

        $usersWithProfiles = $users->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile' => $user->profile->name,
                'is_active' => $user->is_active,
            ];
        });

        return $usersWithProfiles;
    }
}
