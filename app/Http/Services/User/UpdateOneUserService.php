<?php

namespace App\Http\Services\User;

use App\Http\Repositories\UserRepository;
use App\Traits\HttpResponses;

class UpdateOneUserService
{
    use HttpResponses;

    private $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function handle($user, $body)
    {
        $user = $this->userRepository->updateOne($user, $body);

        return $user;
    }
}
