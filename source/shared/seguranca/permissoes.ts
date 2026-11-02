import PerfilUsuario from "../../domain/Enum/PerfilUsuario";
import { ErroNaoAutorizado } from "../erros/ErroNaoAutorizado";
import { ErroProibido } from "../erros/ErroProibido";
import { Permissao, permissoesDoPapel } from "./catalogoPermissoes";

export { Permissao } from "./catalogoPermissoes";

/**
 * Checagem de permissões no backend (RF-002), sempre por ação do catálogo
 * (ver catalogoPermissoes.ts), nunca por papel.
 */
export interface UsuarioAutenticado {
    codigo: string;
    perfil: PerfilUsuario | string;
}

const MENSAGEM_PADRAO = "Você não tem permissão para fazer esta alteração.";

export function exigirAutenticado(usuario: UsuarioAutenticado | undefined | null): UsuarioAutenticado {
    if (!usuario || !usuario.codigo) {
        throw new ErroNaoAutorizado();
    }
    return usuario;
}

export function temPermissao(usuario: UsuarioAutenticado | undefined | null, permissao: Permissao): boolean {
    return !!usuario && permissoesDoPapel(usuario.perfil).includes(permissao);
}

export function exigirPermissao(
    usuario: UsuarioAutenticado | undefined | null,
    permissao: Permissao,
    mensagem: string = MENSAGEM_PADRAO,
): UsuarioAutenticado {
    const autenticado = exigirAutenticado(usuario);
    if (!temPermissao(autenticado, permissao)) {
        throw new ErroProibido(mensagem);
    }
    return autenticado;
}

/**
 * Resolve em nome de quem a ação é feita. Sem a permissão indicada, a pessoa só age por si;
 * com ela, pode indicar outra pessoa (por exemplo, inscrever alguém numa capacitação).
 */
export function resolverUsuarioAlvo(
    usuario: UsuarioAutenticado | undefined | null,
    codigoInformado: string | null | undefined,
    permissao: Permissao,
): string {
    const autenticado = exigirAutenticado(usuario);
    if (!codigoInformado || codigoInformado === autenticado.codigo) {
        return autenticado.codigo;
    }
    if (!temPermissao(autenticado, permissao)) {
        throw new ErroProibido("Você só pode realizar esta ação em seu próprio nome.");
    }
    return codigoInformado;
}

/**
 * Gerir pessoas exige pessoas.gerir; criar, alterar ou promover diretores
 * exige também pessoas.gerirDiretores.
 */
export function exigirPodeGerirPerfil(
    usuario: UsuarioAutenticado | undefined | null,
    perfilDoAlvoAtual: PerfilUsuario | string | null,
    perfilDesejado: PerfilUsuario | string | null,
): UsuarioAutenticado {
    const gestor = exigirPermissao(usuario, Permissao.PESSOAS_GERIR, "Somente diretores e gerentes podem gerenciar pessoas.");
    const envolveDiretor = perfilDoAlvoAtual === PerfilUsuario.DIRETOR || perfilDesejado === PerfilUsuario.DIRETOR;
    if (envolveDiretor && !temPermissao(gestor, Permissao.PESSOAS_GERIR_DIRETORES)) {
        throw new ErroProibido("Somente diretores podem criar, alterar ou promover diretores.");
    }
    return gestor;
}
