<?php

namespace App\Interfaces;

interface UserRepositoryInterface
{

    public function createOne(array $data);
    public function getAll($search);
    public function updateOne($user, $body);
    public function find($id);
    public function deactivateUser($user);
    public function delete($user);
}
