<?php

namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Datas do servidor. "Hoje" é sempre a data em America/Sao_Paulo.
 */
class Data
{
    public const FUSO = 'America/Sao_Paulo';

    public static function hoje(): Carbon
    {
        return Carbon::now(self::FUSO)->startOfDay();
    }

    public static function agora(): Carbon
    {
        return Carbon::now(self::FUSO);
    }

    /** Segunda-feira da semana (semana de segunda a domingo). */
    public static function segundaDaSemana(CarbonInterface|string $data): Carbon
    {
        $texto = $data instanceof CarbonInterface ? $data->toDateString() : $data;

        return Carbon::parse($texto, self::FUSO)->startOfWeek(CarbonInterface::MONDAY);
    }

    /** Diferença em semanas (segunda a domingo) entre duas datas. Positivo se $ate é posterior a $de. */
    public static function semanasEntre(CarbonInterface|string $de, CarbonInterface|string $ate): int
    {
        $a = self::segundaDaSemana($de);
        $b = self::segundaDaSemana($ate);

        return (int) round(($b->getTimestamp() - $a->getTimestamp()) / 604800);
    }
}
