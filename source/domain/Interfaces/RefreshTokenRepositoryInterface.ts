export interface RegistroRefreshToken {
    codigo: string;
    codigoUsuario: string;
    tokenHash: string;
    expiraEm: Date;
    revogadoEm: Date | null;
}

/** Guarda só o hash do refresh token, nunca o token em si. */
export default interface RefreshTokenRepositoryInterface {
    criar(registro: RegistroRefreshToken): Promise<void>;
    buscarPorHash(tokenHash: string): Promise<RegistroRefreshToken | null>;
    revogar(codigo: string): Promise<void>;
    revogarTodosDoUsuario(codigoUsuario: string): Promise<void>;
}
