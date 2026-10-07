<?php

namespace App\Interfaces;

interface AuthRepositoryInterface
{

    public function attempt($data);

    public function findProfileById($profileId);

}