import { ErroAplicacao } from "./ErroAplicacao";

/** Usuário autenticado, mas sem permissão para a ação (HTTP 403). */
export class ErroProibido extends ErroAplicacao {
    constructor(mensagem = "Você não tem permissão para esta ação.") {
        super(mensagem, "ACESSO_PROIBIDO", 403);
    }
}
