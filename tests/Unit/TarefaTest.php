<?php

namespace Tests\Unit;

use App\Models\Tarefa;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class TarefaTest extends TestCase
{
    use PreparaCenario;

    private function tarefa(string $fim, string $status = 'pendente'): Tarefa
    {
        return new Tarefa(['inicio' => '2026-09-01', 'fim' => $fim, 'status' => $status]);
    }

    public function test_atrasada_quando_aberta_e_fim_anterior_a_hoje(): void
    {
        $this->assertTrue($this->tarefa('2026-10-06')->atrasada);
        $this->assertTrue($this->tarefa('2026-10-06', 'andamento')->atrasada);
    }

    public function test_nao_e_atrasada_no_dia_do_fim_nem_quando_concluida(): void
    {
        $this->assertFalse($this->tarefa('2026-10-07')->atrasada);
        $this->assertFalse($this->tarefa('2026-10-01', 'concluida')->atrasada);
    }

    public function test_coluna_concluida_e_3(): void
    {
        $this->assertSame(3, $this->tarefa('2026-10-01', 'concluida')->coluna);
    }

    public function test_coluna_atrasada_fica_em_0(): void
    {
        $this->assertSame(0, $this->tarefa('2026-09-20')->coluna);
    }

    public function test_coluna_pela_semana_do_fim(): void
    {
        $this->assertSame(0, $this->tarefa('2026-10-11')->coluna, 'domingo da semana atual');
        $this->assertSame(1, $this->tarefa('2026-10-12')->coluna, 'segunda da próxima semana');
        $this->assertSame(1, $this->tarefa('2026-10-18')->coluna, 'domingo da próxima semana');
        $this->assertSame(2, $this->tarefa('2026-10-19')->coluna, 'duas semanas à frente');
        $this->assertSame(2, $this->tarefa('2027-01-30')->coluna, 'mais de duas semanas à frente');
    }
}
