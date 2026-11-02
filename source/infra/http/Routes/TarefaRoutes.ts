import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import PrioridadeTarefa from "../../../domain/Enum/PrioridadeTarefa";
import StatusTarefa from "../../../domain/Enum/StatusTarefa";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";
import ListarTarefas from "../../../useCases/ListarTarefas/ListarTarefas";
import CriarTarefa from "../../../useCases/CriarTarefa/CriarTarefa";
import EditarTarefa from "../../../useCases/EditarTarefa/EditarTarefa";
import AlterarStatusTarefa from "../../../useCases/AlterarStatusTarefa/AlterarStatusTarefa";
import ExcluirTarefa from "../../../useCases/ExcluirTarefa/ExcluirTarefa";
import { exigirAutenticado, temPermissao, Permissao, UsuarioAutenticado } from "../../../shared/seguranca/permissoes";
import { ErroProibido } from "../../../shared/erros/ErroProibido";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

export default class TarefaRoutes implements ModelRoutes {
    constructor(private readonly http: Http, private readonly factory: RepositoryFactoryInterface) {}

    /**
     * Gestores gerenciam todas as tarefas; membros só as próprias (matriz de permissões, doc 02).
     * Devolve os responsáveis atuais para que um membro não possa trocá-los.
     */
    private async exigirPodeAlterarTarefa(usuario: UsuarioAutenticado, codigo: string): Promise<string[]> {
        const tarefa = await this.factory.criarTarefaRepository().buscarPorCodigo(codigo);
        if (!tarefa) throw new ErroNaoEncontrado("Tarefa não encontrada.");
        const responsaveis = tarefa.responsaveis.map((r) => r.codigo);
        if (!temPermissao(usuario, Permissao.TAREFAS_GERIR_TODAS) && !responsaveis.includes(usuario.codigo)) {
            throw new ErroProibido("Membros só podem alterar as próprias tarefas.");
        }
        return responsaveis;
    }

    init(): void {
        this.http.route("get", "/tarefas", true, async (_params: any, _body: any, query: any) =>
            new ListarTarefas(this.factory).execute({
                codigoProjeto: query?.codigoProjeto,
                codigoResponsavel: query?.codigoResponsavel,
            }));

        this.http.route("post", "/tarefas", true, async (_params: any, body: any) => {
            const usuario = exigirAutenticado(body.user);
            let codigosResponsaveis: string[] = body.codigosResponsaveis ?? [];
            if (!temPermissao(usuario, Permissao.TAREFAS_GERIR_TODAS)) {
                const projeto = await this.factory.criarProjetoRepository().buscarPorCodigo(body.codigoProjeto);
                if (!projeto || !projeto.membros.some((m) => m.codigo === usuario.codigo)) {
                    throw new ErroProibido("Membros só podem criar tarefas em projetos dos quais participam.");
                }
                codigosResponsaveis = [usuario.codigo];
            }
            return new CriarTarefa(this.factory).execute({
                codigoProjeto: body.codigoProjeto,
                titulo: body.titulo,
                dataInicio: new Date(body.dataInicio),
                dataFim: new Date(body.dataFim),
                prioridade: body.prioridade as PrioridadeTarefa,
                descricao: body.descricao ?? null,
                codigosResponsaveis,
            });
        });

        this.http.route("put", "/tarefas/:codigo", true, async (params: any, body: any) => {
            const usuario = exigirAutenticado(body.user);
            const responsaveisAtuais = await this.exigirPodeAlterarTarefa(usuario, params.codigo);
            return new EditarTarefa(this.factory).execute({
                codigo: params.codigo,
                titulo: body.titulo,
                dataInicio: new Date(body.dataInicio),
                dataFim: new Date(body.dataFim),
                status: body.status as StatusTarefa,
                prioridade: body.prioridade as PrioridadeTarefa,
                descricao: body.descricao ?? null,
                codigosResponsaveis: temPermissao(usuario, Permissao.TAREFAS_GERIR_TODAS) ? (body.codigosResponsaveis ?? []) : responsaveisAtuais,
                codigoDependencia: body.codigoDependencia ?? null,
                checklist: Array.isArray(body.checklist)
                    ? body.checklist.map((item: any) => ({
                        codigo: item.codigo ?? item.id,
                        texto: item.texto,
                        feito: Boolean(item.feito),
                    }))
                    : undefined,
            });
        });

        this.http.route("patch", "/tarefas/:codigo/status", true, async (params: any, body: any) => {
            await this.exigirPodeAlterarTarefa(exigirAutenticado(body.user), params.codigo);
            return new AlterarStatusTarefa(this.factory).execute(params.codigo, body.status as StatusTarefa);
        });

        this.http.route("delete", "/tarefas/:codigo", true, async (params: any, body: any) => {
            await this.exigirPodeAlterarTarefa(exigirAutenticado(body.user), params.codigo);
            return new ExcluirTarefa(this.factory).execute(params.codigo);
        });
    }
}
