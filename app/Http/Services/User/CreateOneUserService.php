<?php

namespace App\Http\Services\User;

use App\Http\Repositories\UserRepository;


class CreateOneUserService
{
    private $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function handle($data)
    {
        return $this->userRepository->createOne($data);
    }
}
