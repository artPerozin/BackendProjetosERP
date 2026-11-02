import RefreshTokenRepositoryInterface, {
    RegistroRefreshToken,
} from "../../../domain/Interfaces/RefreshTokenRepositoryInterface";
import ConexaoBanco from "../../database/ConexaoBanco";

export default class RefreshTokenRepositoryDatabase implements RefreshTokenRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async criar(r: RegistroRefreshToken): Promise<void> {
        await this.conexao.consultar(
            `INSERT INTO refresh_tokens (codigo, usuario_codigo, token_hash, expira_em, revogado_em)
             VALUES ($1, $2, $3, $4, $5)`,
            [r.codigo, r.codigoUsuario, r.tokenHash, r.expiraEm, r.revogadoEm],
        );
    }

    async buscarPorHash(tokenHash: string): Promise<RegistroRefreshToken | null> {
        const linhas = await this.conexao.consultar(
            "SELECT codigo, usuario_codigo, token_hash, expira_em, revogado_em FROM refresh_tokens WHERE token_hash = $1",
            [tokenHash],
        );
        if (!linhas.length) return null;
        const l = linhas[0];
        return { codigo: l.codigo, codigoUsuario: l.usuario_codigo, tokenHash: l.token_hash, expiraEm: l.expira_em, revogadoEm: l.revogado_em };
    }

    async revogar(codigo: string): Promise<void> {
        await this.conexao.consultar(
            "UPDATE refresh_tokens SET revogado_em = now() WHERE codigo = $1 AND revogado_em IS NULL",
            [codigo],
        );
    }

    async revogarTodosDoUsuario(codigoUsuario: string): Promise<void> {
        await this.conexao.consultar(
            "UPDATE refresh_tokens SET revogado_em = now() WHERE usuario_codigo = $1 AND revogado_em IS NULL",
            [codigoUsuario],
        );
    }
}
