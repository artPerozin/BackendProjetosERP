<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/** Cria o primeiro diretor (senha em KONVEX_SENHA_INICIAL). Troque a senha após o primeiro acesso. */
class UsuarioInicialSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'diretor@konvexjr.com.br'],
            [
                'nome' => 'Diretor Konvex',
                'perfil' => User::DIRETOR,
                'ativo' => true,
                'password' => config('konvex.senha_inicial'),
            ]
        );
    }
}
