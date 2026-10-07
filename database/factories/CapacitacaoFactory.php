<?php

namespace Database\Factories;

use App\Models\Capacitacao;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Capacitacao> */
class CapacitacaoFactory extends Factory
{
    protected $model = Capacitacao::class;

    public function definition(): array
    {
        return [
            'titulo' => 'Capacitação '.fake()->unique()->word(),
            'tipo' => 'computacao',
            'data' => '2026-10-20',
            'hora' => '14:00',
            'sala' => 'Sala 101',
            'instrutor' => fake()->name(),
            'vagas' => 10,
        ];
    }
}
