import { sign } from "jsonwebtoken";
import ExpressHttp from "../../source/infra/http/ExpressHttp";
import ExpressAuth from "../../source/infra/http/Middleware/AuthExpress";
import Router from "../../source/infra/http/Router";
import RepositoryFactoryInterface from "../../source/domain/Interfaces/RepositoryFactoryInterface";
import Usuario from "../../source/domain/Entity/Usuario";
import { obterChavePrivada } from "../../source/shared/seguranca/chavesJwt";

/** Sobe a API completa numa porta livre, com o repositório informado. */
export async function subirServidor(factory: RepositoryFactoryInterface) {
    const auth = new ExpressAuth(factory);
    const http = new ExpressHttp(auth);
    new Router(http, factory).init();
    await http.listen(0);
    const base = `http://127.0.0.1:${http.porta()}`;

    async function chamar(
        metodo: string,
        caminho: string,
        opcoes: { usuario?: Usuario; corpo?: unknown; cabecalhos?: Record<string, string> } = {},
    ) {
        const headers: Record<string, string> = { ...(opcoes.cabecalhos ?? {}) };
        if (opcoes.usuario) headers["access-token"] = tokenPara(opcoes.usuario);
        if (opcoes.corpo !== undefined) headers["Content-Type"] = "application/json";
        const resposta = await fetch(base + caminho, {
            method: metodo.toUpperCase(),
            headers,
            body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
        });
        const texto = await resposta.text();
        let corpo: any = null;
        try { corpo = texto ? JSON.parse(texto) : null; } catch { corpo = texto; }
        return { status: resposta.status, corpo, headers: resposta.headers };
    }

    return { http, base, chamar, fechar: () => http.close() };
}

export function tokenPara(usuario: Usuario): string {
    return sign({ codigo: usuario.codigo, email: usuario.email }, obterChavePrivada(), {
        algorithm: "RS256",
        expiresIn: "5m",
    });
}
