import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Usuario from "../../domain/Entity/Usuario";
import { hoje } from "../../domain/Entity/Participacao";
import StatusPessoa, { STATUS_DE_SAIDA } from "../../domain/Enum/StatusPessoa";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

export interface AlterarStatusPessoaInput {
    codigo: string;
    status: StatusPessoa;
    /** Data de saída para Alumni ou Inativo (padrão: hoje). */
    dataSaida?: Date | null;
    /**
     * Se verdadeiro (padrão), encerra as participações em aberto com a mesma data de saída.
     * A decisão final está em aberto (QA-31); por isso a pessoa que faz a mudança escolhe.
     */
    encerrarParticipacoes?: boolean;
}

export interface AlterarStatusPessoaOutput {
    usuario: Usuario;
    participacoesEncerradas: number;
}

/**
 * PR-01 e RN-01: a saída muda o status para Alumni ou Inativo e registra a data.
 * Nada é apagado: projetos, tarefas, documentos e capacitações continuam ligados à pessoa.
 */
export default class AlterarStatusPessoa {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: AlterarStatusPessoaInput): Promise<AlterarStatusPessoaOutput> {
        if (!Object.values(StatusPessoa).includes(input.status)) {
            throw new ErroValidacao("Status de pessoa inválido.", "STATUS_PESSOA_INVALIDO");
        }
        const usuarios = this.factory.criarUsuarioRepository();
        const atual = await usuarios.buscarPorCodigo(input.codigo);
        if (!atual) throw new ErroNaoEncontrado("Usuário não encontrado.");

        const saindo = STATUS_DE_SAIDA.includes(input.status);
        const dataSaida = saindo ? (input.dataSaida ?? atual.dataSaida ?? hoje()) : null;
        const usuario = atual.copiar({ status: input.status, dataSaida });
        await usuarios.editar(usuario);

        let participacoesEncerradas = 0;
        // Quem fica sem acesso (saída ou trainee) tem as sessões encerradas na hora.
        if (!usuario.ativo) {
            await this.factory.criarRefreshTokenRepository().revogarTodosDoUsuario(usuario.codigo);
        }
        if (saindo) {

            if (input.encerrarParticipacoes !== false) {
                const projetos = this.factory.criarProjetoRepository();
                for (const projeto of await projetos.listarPorMembro(usuario.codigo)) {
                    const aberta = projeto.participacaoAtivaDe(usuario.codigo);
                    if (!aberta) continue;
                    const saida = dataSaida!.getTime() < aberta.dataEntrada.getTime() ? aberta.dataEntrada : dataSaida!;
                    await projetos.editar(projeto.copiar({
                        participacoes: projeto.participacoes.map((p) =>
                            p.codigo === aberta.codigo ? p.copiar({ dataSaida: saida }) : p,
                        ),
                    }));
                    participacoesEncerradas += 1;
                }
            }
        }
        return { usuario, participacoesEncerradas };
    }
}
