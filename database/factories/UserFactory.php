<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<User> */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'nome' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => 'senha123',
            'perfil' => User::MEMBRO,
            'ativo' => true,
        ];
    }

    public function diretor(): static
    {
        return $this->state(['perfil' => User::DIRETOR]);
    }

    public function gerente(): static
    {
        return $this->state(['perfil' => User::GERENTE]);
    }

    public function membro(): static
    {
        return $this->state(['perfil' => User::MEMBRO]);
    }

    public function inativo(): static
    {
        return $this->state(['ativo' => false]);
    }
}
