<?php

namespace Tests\Unit;

use App\Services\EficienciaService;
use PHPUnit\Framework\TestCase;

class EficienciaCalculoTest extends TestCase
{
    public function test_sem_base_de_calculo_devolve_null(): void
    {
        $this->assertNull(EficienciaService::calcular(0, 0, 0));
    }

    public function test_formula_arredondada(): void
    {
        $this->assertSame(67, EficienciaService::calcular(2, 2, 1));  // 2 / 3
        $this->assertSame(33, EficienciaService::calcular(1, 2, 1));  // 1 / 3
        $this->assertSame(100, EficienciaService::calcular(1, 1, 0));
        $this->assertSame(0, EficienciaService::calcular(0, 0, 2));   // só atrasadas em aberto
    }
}
