<?php

namespace Tests\Unit;

use App\Support\Data;
use Tests\Concerns\PreparaCenario;
use Tests\TestCase;

class DataTest extends TestCase
{
    use PreparaCenario;

    public function test_hoje_usa_fuso_de_sao_paulo(): void
    {
        $this->assertSame('2026-10-07', Data::hoje()->toDateString());
    }

    public function test_segunda_da_semana(): void
    {
        $this->assertSame('2026-10-05', Data::segundaDaSemana('2026-10-07')->toDateString());
        $this->assertSame('2026-10-05', Data::segundaDaSemana('2026-10-11')->toDateString());
        $this->assertSame('2026-10-12', Data::segundaDaSemana('2026-10-12')->toDateString());
    }

    public function test_semanas_entre(): void
    {
        $this->assertSame(0, Data::semanasEntre('2026-10-07', '2026-10-09'));
        $this->assertSame(2, Data::semanasEntre('2026-10-07', '2026-10-23'));
        $this->assertSame(-1, Data::semanasEntre('2026-10-07', '2026-09-30'));
    }
}
