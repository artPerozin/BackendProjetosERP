import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import { ErroNaoAutorizado } from "../../shared/erros/ErroNaoAutorizado";
import { emitirSessao, hashToken, Sessao } from "./emitirSessao";

/**
 * Troca um refresh token válido por uma sessão nova. O token usado é revogado (rotação).
 * Se um token já revogado for reapresentado, todas as sessões da pessoa são encerradas,
 * porque isso indica que o token pode ter vazado.
 */
export default class RenovarSessao {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(refreshToken: string): Promise<Sessao> {
        if (!refreshToken || typeof refreshToken !== "string") {
            throw new ErroNaoAutorizado("Sessão expirada. Entre novamente.");
        }
        const tokens = this.factory.criarRefreshTokenRepository();
        const registro = await tokens.buscarPorHash(hashToken(refreshToken));
        if (!registro) throw new ErroNaoAutorizado("Sessão expirada. Entre novamente.");

        if (registro.revogadoEm) {
            await tokens.revogarTodosDoUsuario(registro.codigoUsuario);
            throw new ErroNaoAutorizado("Sessão expirada. Entre novamente.");
        }
        if (registro.expiraEm.getTime() <= Date.now()) {
            await tokens.revogar(registro.codigo);
            throw new ErroNaoAutorizado("Sessão expirada. Entre novamente.");
        }

        const usuario = await this.factory.criarUsuarioRepository().buscarPorCodigo(registro.codigoUsuario);
        await tokens.revogar(registro.codigo);
        if (!usuario || !usuario.ativo) throw new ErroNaoAutorizado("Sessão expirada. Entre novamente.");

        return emitirSessao(this.factory, usuario);
    }
}
