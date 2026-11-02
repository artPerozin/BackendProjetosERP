import { compare, hash } from "bcrypt";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";
import { MENSAGENS_DE_ERRO } from "../../shared/erros/mensagensDeErro";

export const TAMANHO_MINIMO_SENHA = 6;

export function validarNovaSenha(senha: unknown): string {
    if (typeof senha !== "string" || senha.length < TAMANHO_MINIMO_SENHA) {
        throw new ErroValidacao(MENSAGENS_DE_ERRO.VALIDACAO.SENHA_CURTA, "SENHA_CURTA");
    }
    return senha;
}

/**
 * Troca a senha. Quando `senhaAtual` é informada (a própria pessoa), ela é conferida;
 * quando um gestor redefine a senha de alguém, a conferência é dispensada pela rota.
 * Em ambos os casos, todas as sessões abertas são encerradas.
 */
export default class AlterarSenha {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: { codigoUsuario: string; novaSenha: string; senhaAtual?: string; exigirSenhaAtual: boolean }): Promise<void> {
        const usuarios = this.factory.criarUsuarioRepository();
        const usuario = await usuarios.buscarPorCodigo(input.codigoUsuario);
        if (!usuario) throw new ErroNaoEncontrado(MENSAGENS_DE_ERRO.USUARIO.NAO_ENCONTRADO);

        if (input.exigirSenhaAtual) {
            const confere = typeof input.senhaAtual === "string" && (await compare(input.senhaAtual, usuario.senha));
            if (!confere) throw new ErroValidacao("A senha atual não confere.", "SENHA_ATUAL_INCORRETA");
        }

        const senha = await hash(validarNovaSenha(input.novaSenha), 10);
        await usuarios.editar(usuario.copiar({ senha }));
        await this.factory.criarRefreshTokenRepository().revogarTodosDoUsuario(usuario.codigo);
    }
}
