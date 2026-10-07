<?php

namespace App\Models;

use App\Services\PermissionService;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const DIRETOR = 'diretor';
    public const GERENTE = 'gerente';
    public const MEMBRO = 'membro';
    public const PERFIS = [self::DIRETOR, self::GERENTE, self::MEMBRO];

    protected $table = 'users';

    protected $fillable = ['nome', 'email', 'perfil', 'ativo', 'password'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'ativo' => 'boolean',
            'password' => 'hashed',
        ];
    }

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }

    public function projetos(): BelongsToMany
    {
        return $this->belongsToMany(Projeto::class, 'projeto_usuario', 'usuario_id', 'projeto_id');
    }

    public function tarefas(): BelongsToMany
    {
        return $this->belongsToMany(Tarefa::class, 'tarefa_usuario', 'usuario_id', 'tarefa_id');
    }

    public function capacitacoes(): BelongsToMany
    {
        return $this->belongsToMany(Capacitacao::class, 'capacitacao_inscricoes', 'usuario_id', 'capacitacao_id')
            ->withTimestamps();
    }

    /** Permissões do perfil (vêm do service de get-permissions). */
    public function permissoes(): array
    {
        return app(PermissionService::class)->getPermissions($this->perfil);
    }

    public function temPermissao(string $permissao): bool
    {
        return in_array($permissao, $this->permissoes(), true);
    }

    public function ehDiretor(): bool
    {
        return $this->perfil === self::DIRETOR;
    }
}
