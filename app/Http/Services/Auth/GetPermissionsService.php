<?php

namespace App\Http\Services\Auth;

class GetPermissionsService
{
    private $permissions = [
        'ADMIN' => [
            'create-users',
            'get-users',
            'delete-users',
            'update-users',
        ],
    ];

    public function handle($profileName)
    {
        return $this->permissions[$profileName] ?? [];
    }
}
