import { createHash, randomBytes } from "crypto";
import { sign } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import Usuario from "../../domain/Entity/Usuario";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import { obterChavePrivada } from "../../shared/seguranca/chavesJwt";

/** Tempo de vida do token de acesso (padrão 15 minutos). */
export const DURACAO_ACESSO = process.env.JWT_ACCESS_TTL ?? "15m";
/** Tempo de vida do refresh token, em dias (padrão 7). */
export const DIAS_REFRESH = Number(process.env.REFRESH_TOKEN_DIAS ?? 7);

export interface Sessao {
    /** Token de acesso JWT, enviado no cabeçalho access-token. */
    token: string;
    /** Token opaco para renovar a sessão em POST /auth/refresh. */
    refreshToken: string;
    refreshTokenExpiraEm: Date;
    usuario: Usuario;
}

export function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function gerarTokenAcesso(usuario: Usuario): string {
    return sign({ codigo: usuario.codigo, email: usuario.email }, obterChavePrivada(), {
        algorithm: "RS256",
        expiresIn: DURACAO_ACESSO as any,
    });
}

/** Emite um token de acesso e um refresh token novo (RF-001). */
export async function emitirSessao(factory: RepositoryFactoryInterface, usuario: Usuario): Promise<Sessao> {
    const refreshToken = randomBytes(48).toString("base64url");
    const expiraEm = new Date(Date.now() + DIAS_REFRESH * 24 * 60 * 60 * 1000);
    await factory.criarRefreshTokenRepository().criar({
        codigo: uuid(),
        codigoUsuario: usuario.codigo,
        tokenHash: hashToken(refreshToken),
        expiraEm,
        revogadoEm: null,
    });
    return { token: gerarTokenAcesso(usuario), refreshToken, refreshTokenExpiraEm: expiraEm, usuario };
}
