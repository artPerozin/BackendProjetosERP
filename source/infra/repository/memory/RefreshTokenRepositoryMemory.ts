import RefreshTokenRepositoryInterface, {
    RegistroRefreshToken,
} from "../../../domain/Interfaces/RefreshTokenRepositoryInterface";

export default class RefreshTokenRepositoryMemory implements RefreshTokenRepositoryInterface {
    private registros: RegistroRefreshToken[] = [];

    async criar(registro: RegistroRefreshToken): Promise<void> {
        this.registros.push({ ...registro });
    }

    async buscarPorHash(tokenHash: string): Promise<RegistroRefreshToken | null> {
        const registro = this.registros.find((r) => r.tokenHash === tokenHash);
        return registro ? { ...registro } : null;
    }

    async revogar(codigo: string): Promise<void> {
        const registro = this.registros.find((r) => r.codigo === codigo);
        if (registro && !registro.revogadoEm) registro.revogadoEm = new Date();
    }

    async revogarTodosDoUsuario(codigoUsuario: string): Promise<void> {
        for (const registro of this.registros) {
            if (registro.codigoUsuario === codigoUsuario && !registro.revogadoEm) registro.revogadoEm = new Date();
        }
    }
}
