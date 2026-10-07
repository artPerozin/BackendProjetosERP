<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Repositories\UsuarioRepository;
use Illuminate\Pagination\LengthAwarePaginator;

class UsuarioService
{
    public function __construct(private readonly UsuarioRepository $usuarios)
    {
    }

    public function listar(array $filtros): LengthAwarePaginator
    {
        return $this->usuarios->paginar($filtros);
    }

    /** O próprio usuário sempre pode se consultar; os demais precisam da permissão de listagem. */
    public function detalhar(User $ator, int $id): User
    {
        if ($ator->id !== $id && ! $ator->temPermissao('usuarios.listar')) {
            throw ApiException::semPermissao();
        }

        return $this->usuarios->encontrarOuFalhar($id);
    }

    public function criar(array $dados): User
    {
        $this->garantirEmailLivre($dados['email']);

        return $this->usuarios->criar([
            'nome' => $dados['nome'],
            'email' => $dados['email'],
            'perfil' => $dados['perfil'],
            'ativo' => true,
            'password' => config('konvex.senha_inicial'),
        ]);
    }

    public function atualizar(User $ator, int $id, array $dados): User
    {
        $usuario = $this->usuarios->encontrarOuFalhar($id);

        $this->garantirEmailLivre($dados['email'], $usuario->id);
        $this->garantirPerfilProprioIntacto($ator, $usuario, $dados['perfil']);

        return $this->usuarios->atualizar($usuario, [
            'nome' => $dados['nome'],
            'email' => $dados['email'],
            'perfil' => $dados['perfil'],
        ]);
    }

    public function definirPerfil(User $ator, int $id, string $perfil): User
    {
        $usuario = $this->usuarios->encontrarOuFalhar($id);

        $this->garantirPerfilProprioIntacto($ator, $usuario, $perfil);

        return $this->usuarios->atualizar($usuario, ['perfil' => $perfil]);
    }

    /** Usuário não é excluído: inativa ou reativa. Inativo perde os tokens e não autentica mais. */
    public function definirStatus(User $ator, int $id, bool $ativo): User
    {
        $usuario = $this->usuarios->encontrarOuFalhar($id);

        if (! $ativo && $ator->id === $usuario->id) {
            throw ApiException::conflito('AUTO_INATIVACAO', 'Você não pode inativar o próprio usuário.');
        }

        $usuario = $this->usuarios->atualizar($usuario, ['ativo' => $ativo]);

        if (! $ativo) {
            $usuario->tokens()->delete();
        }

        return $usuario;
    }

    private function garantirEmailLivre(string $email, ?int $ignorarId = null): void
    {
        if ($this->usuarios->emailEmUso($email, $ignorarId)) {
            throw ApiException::conflito('EMAIL_JA_CADASTRADO', 'E-mail já cadastrado.', ['email' => 'já cadastrado']);
        }
    }

    private function garantirPerfilProprioIntacto(User $ator, User $alvo, string $novoPerfil): void
    {
        if ($ator->id === $alvo->id && $alvo->perfil !== $novoPerfil) {
            throw ApiException::conflito('AUTO_ALTERACAO_PERFIL', 'Você não pode alterar o próprio perfil.');
        }
    }
}
