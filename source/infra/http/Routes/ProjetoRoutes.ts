import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";
import StatusProjeto from "../../../domain/Enum/StatusProjeto";
import PrioridadeProjeto from "../../../domain/Enum/PrioridadeProjeto";
import ListarProjetos from "../../../useCases/ListarProjetos/ListarProjetos";
import CriarProjeto from "../../../useCases/CriarProjeto/CriarProjeto";
import EditarProjeto from "../../../useCases/EditarProjeto/EditarProjeto";
import ExcluirProjeto from "../../../useCases/ExcluirProjeto/ExcluirProjeto";
import AlternarStatusProjeto from "../../../useCases/AlternarStatusProjeto/AlternarStatusProjeto";
import { AdicionarParticipante, EditarParticipacao, EncerrarParticipacao } from "../../../useCases/Projetos/Equipe";
import { EntradaDetalhesProjeto } from "../../../useCases/Projetos/dadosProjeto";
import { exigirPermissao, Permissao } from "../../../shared/seguranca/permissoes";
import { lerData, lerDataObrigatoria, lerEnum, lerInteiro, lerLista } from "../../../shared/entradas";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

function lerDetalhes(body: any): EntradaDetalhesProjeto {
    return {
        referencia: body.referencia,
        objetivo: body.objetivo,
        clienteNome: body.clienteNome,
        prioridade: lerEnum(body.prioridade, PrioridadeProjeto, "prioridade"),
        progresso: lerInteiro(body.progresso, "progresso"),
        codigoResponsavel: body.codigoResponsavel,
        codigoArea: body.codigoArea,
        tags: body.tags === undefined ? undefined : lerLista(body.tags),
    };
}

/** Projetos e equipe (RF-020 a RF-024). Leitura para todos; escrita para gestores. */
export default class ProjetoRoutes implements ModelRoutes {
    constructor(private readonly http: Http, private readonly factory: RepositoryFactoryInterface) {}

    init(): void {
        const f = this.factory;

        this.http.route("get", "/projetos", true, async (_p: any, _b: any, query: any) =>
            new ListarProjetos(f).execute({
                codigoUsuario: query?.codigoUsuario || undefined,
                status: lerLista(query?.status).map((s) => lerEnum(s, StatusProjeto, "status")!),
                codigoArea: query?.codigoArea || undefined,
                codigoResponsavel: query?.codigoResponsavel || undefined,
                busca: query?.busca || undefined,
            }));

        this.http.route("get", "/projetos/:codigo", true, async (params: any) => {
            const projeto = await f.criarProjetoRepository().buscarPorCodigo(params.codigo);
            if (!projeto) throw new ErroNaoEncontrado("Projeto não encontrado.");
            return projeto;
        });

        this.http.route("post", "/projetos", true, async (_p: any, body: any) => {
            exigirPermissao(body.user, Permissao.PROJETOS_EDITAR);
            return new CriarProjeto(f).execute({
                nome: body.nome,
                descricao: body.descricao,
                dataInicio: lerDataObrigatoria(body.dataInicio, "dataInicio"),
                dataFim: lerDataObrigatoria(body.dataFim, "dataFim"),
                status: lerEnum(body.status, StatusProjeto, "status"),
                codigosMembros: body.codigosMembros ?? [],
                ...lerDetalhes(body),
            });
        });

        this.http.route("put", "/projetos/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.PROJETOS_EDITAR);
            return new EditarProjeto(f).execute({
                codigo: params.codigo,
                nome: body.nome,
                descricao: body.descricao,
                dataInicio: lerDataObrigatoria(body.dataInicio, "dataInicio"),
                dataFim: lerDataObrigatoria(body.dataFim, "dataFim"),
                status: lerEnum(body.status, StatusProjeto, "status"),
                codigosMembros: body.codigosMembros,
                ...lerDetalhes(body),
            });
        });

        this.http.route("patch", "/projetos/:codigo/status", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.PROJETOS_EDITAR);
            return new AlternarStatusProjeto(f).execute(params.codigo, lerEnum(body.status, StatusProjeto, "status"));
        });

        // Excluir apaga também as tarefas; prefira o status Arquivado. Só diretores.
        this.http.route("delete", "/projetos/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.PROJETOS_EXCLUIR, "Somente diretores excluem projetos. Use o status Arquivado.");
            return new ExcluirProjeto(f).execute(params.codigo);
        });

        // Equipe (PR-06)
        this.http.route("post", "/projetos/:codigo/membros", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.PROJETOS_EDITAR);
            return new AdicionarParticipante(f).execute({
                codigoProjeto: params.codigo,
                codigoUsuario: body.codigoUsuario,
                funcao: body.funcao,
                responsabilidades: body.responsabilidades,
                alocacao: lerInteiro(body.alocacao, "alocacao"),
                dataEntrada: lerData(body.dataEntrada, "dataEntrada"),
            });
        });

        this.http.route("put", "/projetos/:codigo/membros/:codigoParticipacao", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.PROJETOS_EDITAR);
            return new EditarParticipacao(f).execute({
                codigoProjeto: params.codigo,
                codigoParticipacao: params.codigoParticipacao,
                funcao: body.funcao,
                responsabilidades: body.responsabilidades,
                alocacao: lerInteiro(body.alocacao, "alocacao"),
            });
        });

        this.http.route("post", "/projetos/:codigo/membros/:codigoParticipacao/encerrar", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.PROJETOS_EDITAR);
            return new EncerrarParticipacao(f).execute({
                codigoProjeto: params.codigo,
                codigoParticipacao: params.codigoParticipacao,
                dataSaida: lerData(body.dataSaida, "dataSaida"),
            });
        });
    }
}
