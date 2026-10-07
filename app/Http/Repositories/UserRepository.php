<?php

namespace App\Http\Repositories;

use App\Interfaces\UserRepositoryInterface;
use App\Models\User;

class UserRepository implements UserRepositoryInterface
{

    public function createOne(array $data)
    {
        return User::create($data);
    }

    public function getAll($search)
    {
        $search = strtolower($search);

        return User::query()->with("profile")->withTrashed()
            ->where(function ($query) use ($search) {
                $query->where('name', 'like', "%$search%")
                    ->orWhere('email', 'like', "%$search%");
            })
            ->orderBy('id')
            ->get();
    }

    public function getProfilesWithCount()
    {
        return User::selectRaw('profiles.name as profile_name, count(users.id) as count')
            ->join('profiles', 'users.profile_id', '=', 'profiles.id')
            ->groupBy('profiles.name')
            ->pluck('count', 'profile_name');
    }

    public function updateOne($user, $body)
    {
        $user->update($body);

        return $user;
    }

    public function find($id)
    {
        return User::withTrashed()->find($id);
    }

    public function getUserAndFiles($id)
    {
        return User::withTrashed()
            ->with('file')
            ->find($id);
    }

    public function deactivateUser($user)
    {
        $user->is_active = false;
        $user->save();
    }

    public function delete($user)
    {
        $user->delete();
    }
}
