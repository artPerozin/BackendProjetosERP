<?php

namespace App\Models;

use App\Support\Data;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Capacitacao extends Model
{
    use HasFactory;

    public const TIPOS = ['mecanica', 'computacao', 'eletrica'];
    public const ROTULOS = [
        'mecanica' => 'Mecânica',
        'computacao' => 'Computação',
        'eletrica' => 'Elétrica',
    ];

    protected $table = 'capacitacoes';

    protected $fillable = ['titulo', 'tipo', 'data', 'hora', 'sala', 'instrutor', 'vagas'];

    protected function casts(): array
    {
        return ['data' => 'date', 'vagas' => 'integer'];
    }

    public function inscritos(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'capacitacao_inscricoes', 'capacitacao_id', 'usuario_id')
            ->withTimestamps();
    }

    public function jaOcorreu(): bool
    {
        $inicio = Carbon::parse($this->data->toDateString().' '.$this->hora, Data::FUSO);

        return $inicio->lt(Data::agora());
    }
}
