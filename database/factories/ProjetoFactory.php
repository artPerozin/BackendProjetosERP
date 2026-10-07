<?php

namespace Database\Factories;

use App\Models\Projeto;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Projeto> */
class ProjetoFactory extends Factory
{
    protected $model = Projeto::class;

    public function definition(): array
    {
        return [
            'nome' => 'Projeto '.fake()->unique()->word(),
            'descricao' => fake()->sentence(),
            'inicio' => '2026-09-01',
            'fim' => '2026-12-15',
            'status' => Projeto::EM_EXECUCAO,
        ];
    }

    public function concluido(): static
    {
        return $this->state(['status' => Projeto::CONCLUIDO]);
    }
}
