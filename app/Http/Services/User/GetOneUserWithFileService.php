<?php

namespace App\Http\Services\User;

use App\Http\Repositories\UserRepository;
use App\Traits\HttpResponses;


class GetOneUserWithFileService
{
    use HttpResponses;

    private $userRepository;

    public function __construct(UserRepository $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function handle($id)
    {
        $user = $this->userRepository->getUserAndFiles($id);

        return $user;
    }
}
