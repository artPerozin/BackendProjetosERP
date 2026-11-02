import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Projeto from "../../domain/Entity/Projeto";
import Participacao, { hoje } from "../../domain/Entity/Participacao";
import { calcularAlocacao, ResumoAlocacao } from "../../domain/Service/alocacao";
import { ErroConflito } from "../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/** Resultado das operações da aba Equipe: o projeto e o alerta de alocação da pessoa (RN-04). */
export interface ResultadoEquipe {
    projeto: Projeto;
    alocacao: ResumoAlocacao;
}

async function carregar(factory: RepositoryFactoryInterface, codigoProjeto: string): Promise<Projeto> {
    const projeto = await factory.criarProjetoRepository().buscarPorCodigo(codigoProjeto);
    if (!projeto) throw new ErroNaoEncontrado("Projeto não encontrado.");
    return projeto;
}

async function gravarEResumir(factory: RepositoryFactoryInterface, projeto: Projeto, codigoUsuario: string): Promise<ResultadoEquipe> {
    const repo = factory.criarProjetoRepository();
    await repo.editar(projeto);
    const projetosDaPessoa = await repo.listarPorMembro(codigoUsuario);
    return { projeto, alocacao: calcularAlocacao(projetosDaPessoa, codigoUsuario) };
}

/** PR-06: adiciona uma pessoa à equipe com função, responsabilidades e alocação. */
export class AdicionarParticipante {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: {
        codigoProjeto: string;
        codigoUsuario: string;
        funcao?: string | null;
        responsabilidades?: string | null;
        alocacao?: number;
        dataEntrada?: Date | null;
    }): Promise<ResultadoEquipe> {
        const projeto = await carregar(this.factory, input.codigoProjeto);
        const usuario = await this.factory.criarUsuarioRepository().buscarPorCodigo(input.codigoUsuario);
        if (!usuario) throw new ErroNaoEncontrado("Pessoa não encontrada.");
        if (!usuario.naEj) throw new ErroValidacao("Só pessoas Ativas ou Trainees entram em projetos.", "PESSOA_FORA_DA_EJ");
        if (projeto.participacaoAtivaDe(usuario.codigo)) {
            throw new ErroConflito("A pessoa já participa deste projeto.", "PARTICIPACAO_DUPLICADA");
        }
        const participacao = new Participacao(usuario, {
            funcao: input.funcao,
            responsabilidades: input.responsabilidades,
            alocacao: input.alocacao,
            dataEntrada: input.dataEntrada ?? hoje(),
        });
        return gravarEResumir(
            this.factory,
            projeto.copiar({ participacoes: [...projeto.participacoes, participacao] }),
            usuario.codigo,
        );
    }
}

/** Edita função, responsabilidades e alocação de uma participação em aberto. */
export class EditarParticipacao {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: {
        codigoProjeto: string;
        codigoParticipacao: string;
        funcao?: string | null;
        responsabilidades?: string | null;
        alocacao?: number;
    }): Promise<ResultadoEquipe> {
        const projeto = await carregar(this.factory, input.codigoProjeto);
        const atual = projeto.participacoes.find((p) => p.codigo === input.codigoParticipacao);
        if (!atual) throw new ErroNaoEncontrado("Participação não encontrada.");
        if (!atual.ativa) throw new ErroValidacao("Participações encerradas não podem ser alteradas.", "PARTICIPACAO_ENCERRADA");
        const editada = atual.copiar({
            funcao: input.funcao,
            responsabilidades: input.responsabilidades,
            alocacao: input.alocacao,
        });
        return gravarEResumir(
            this.factory,
            projeto.copiar({ participacoes: projeto.participacoes.map((p) => (p.codigo === atual.codigo ? editada : p)) }),
            atual.usuario.codigo,
        );
    }
}

/** Encerra a participação: a pessoa sai da equipe, mas continua no histórico do projeto. */
export class EncerrarParticipacao {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: { codigoProjeto: string; codigoParticipacao: string; dataSaida?: Date | null }): Promise<ResultadoEquipe> {
        const projeto = await carregar(this.factory, input.codigoProjeto);
        const atual = projeto.participacoes.find((p) => p.codigo === input.codigoParticipacao);
        if (!atual) throw new ErroNaoEncontrado("Participação não encontrada.");
        if (!atual.ativa) throw new ErroValidacao("Esta participação já foi encerrada.", "PARTICIPACAO_ENCERRADA");
        const encerrada = atual.copiar({ dataSaida: input.dataSaida ?? hoje() });
        return gravarEResumir(
            this.factory,
            projeto.copiar({ participacoes: projeto.participacoes.map((p) => (p.codigo === atual.codigo ? encerrada : p)) }),
            atual.usuario.codigo,
        );
    }
}
