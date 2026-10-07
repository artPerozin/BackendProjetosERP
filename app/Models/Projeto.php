<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Projeto extends Model
{
    use HasFactory;

    public const EM_EXECUCAO = 'em_execucao';
    public const CONCLUIDO = 'concluido';
    public const STATUS = [self::EM_EXECUCAO, self::CONCLUIDO];

    protected $table = 'projetos';

    protected $fillable = ['nome', 'descricao', 'inicio', 'fim', 'status'];

    protected function casts(): array
    {
        return ['inicio' => 'date', 'fim' => 'date'];
    }

    public function membros(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'projeto_usuario', 'projeto_id', 'usuario_id');
    }

    public function tarefas(): HasMany
    {
        return $this->hasMany(Tarefa::class, 'projeto_id');
    }

    /** Progresso = concluídas / total x 100 (0 se não houver tarefas). Calculado, nunca enviado pelo front. */
    public function getProgressoAttribute(): int
    {
        if ($this->relationLoaded('tarefas')) {
            $total = $this->tarefas->count();
            $concluidas = $this->tarefas->where('status', Tarefa::CONCLUIDA)->count();
        } elseif (array_key_exists('tarefas_count', $this->attributes)) {
            $total = (int) $this->attributes['tarefas_count'];
            $concluidas = (int) ($this->attributes['tarefas_concluidas_count'] ?? 0);
        } else {
            $total = $this->tarefas()->count();
            $concluidas = $this->tarefas()->where('status', Tarefa::CONCLUIDA)->count();
        }

        return $total === 0 ? 0 : (int) round($concluidas / $total * 100);
    }
}
