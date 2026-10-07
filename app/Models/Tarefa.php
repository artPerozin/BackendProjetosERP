<?php

namespace App\Models;

use App\Support\Data;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tarefa extends Model
{
    use HasFactory;

    public const PENDENTE = 'pendente';
    public const ANDAMENTO = 'andamento';
    public const CONCLUIDA = 'concluida';
    public const STATUS = [self::PENDENTE, self::ANDAMENTO, self::CONCLUIDA];
    public const PRIORIDADES = ['P1', 'P2', 'P3', 'P4'];

    protected $table = 'tarefas';

    protected $fillable = ['projeto_id', 'titulo', 'prioridade', 'inicio', 'fim', 'status', 'conclusao'];

    protected function casts(): array
    {
        return ['inicio' => 'date', 'fim' => 'date', 'conclusao' => 'date'];
    }

    public function projeto(): BelongsTo
    {
        return $this->belongsTo(Projeto::class, 'projeto_id');
    }

    public function responsaveis(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'tarefa_usuario', 'tarefa_id', 'usuario_id');
    }

    public function estaConcluida(): bool
    {
        return $this->status === self::CONCLUIDA;
    }

    /** Atrasada = status diferente de concluída e fim < hoje. */
    public function getAtrasadaAttribute(): bool
    {
        return ! $this->estaConcluida()
            && $this->fim !== null
            && $this->fim->toDateString() < Data::hoje()->toDateString();
    }

    /**
     * Coluna do Kanban: concluída = 3. Demais: semana do fim em relação à semana atual
     * (segunda a domingo). Anterior ou atual = 0, próxima = 1, duas à frente ou mais = 2.
     * Atrasadas ficam na coluna 0.
     */
    public function getColunaAttribute(): int
    {
        if ($this->estaConcluida()) {
            return 3;
        }

        if ($this->atrasada) {
            return 0;
        }

        return max(0, min(2, Data::semanasEntre(Data::hoje(), $this->fim)));
    }
}
