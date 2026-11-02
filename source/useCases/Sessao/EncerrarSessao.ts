import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import { hashToken } from "./emitirSessao";

/** Revoga o refresh token informado (logout). Não falha se o token já não valer. */
export default class EncerrarSessao {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(refreshToken?: string | null): Promise<void> {
        if (!refreshToken) return;
        const tokens = this.factory.criarRefreshTokenRepository();
        const registro = await tokens.buscarPorHash(hashToken(refreshToken));
        if (registro) await tokens.revogar(registro.codigo);
    }
}
