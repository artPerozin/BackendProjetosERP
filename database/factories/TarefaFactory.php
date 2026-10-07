<?php

namespace Database\Factories;

use App\Models\Projeto;
use App\Models\Tarefa;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Tarefa> */
class TarefaFactory extends Factory
{
    protected $model = Tarefa::class;

    public function definition(): array
    {
        return [
            'projeto_id' => Projeto::factory(),
            'titulo' => fake()->sentence(3),
            'prioridade' => 'P2',
            'inicio' => '2026-10-01',
            'fim' => '2026-10-30',
            'status' => Tarefa::PENDENTE,
            'conclusao' => null,
        ];
    }

    public function concluida(string $conclusao): static
    {
        return $this->state(['status' => Tarefa::CONCLUIDA, 'conclusao' => $conclusao]);
    }
}
