<?php

namespace Database\Seeders;

use App\Models\Profile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        try {
            DB::beginTransaction();

            Profile::create(['id' => 1, 'name' => 'ADMIN']);

            User::create([
                'id' => 1,
                'name' => 'ADMIN',
                'email' => env("DEFAULT_EMAIL"),
                'password' => env("DEFAULT_PASSWORD"),
                'profile_id' => 1
            ]);

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erro ao popular o banco de dados: ' . $e->getMessage());
        }
    }
}