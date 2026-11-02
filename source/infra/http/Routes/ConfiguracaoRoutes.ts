import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";
import SalvarArea from "../../../useCases/Configuracoes/SalvarArea";
import SalvarCargo from "../../../useCases/Configuracoes/SalvarCargo";
import SalvarSenioridade from "../../../useCases/Configuracoes/SalvarSenioridade";
import { exigirPermissao, Permissao } from "../../../shared/seguranca/permissoes";
import { lerInteiro } from "../../../shared/entradas";

const SO_DIRETOR = "Somente diretores configuram áreas, cargos e senioridades.";

/** Configurações (ADR-007): leitura para todos, escrita só para diretores (ADMIN). */
export default class ConfiguracaoRoutes implements ModelRoutes {
    constructor(private readonly http: Http, private readonly factory: RepositoryFactoryInterface) {}

    init(): void {
        const f = this.factory;

        this.http.route("get", "/areas", true, async () => f.criarAreaRepository().listar());
        this.http.route("post", "/areas", true, async (_p: any, body: any) => {
            exigirPermissao(body.user, Permissao.CONFIGURACOES_EDITAR, SO_DIRETOR);
            return new SalvarArea(f).execute({ nome: body.nome, codigoAreaPai: body.codigoAreaPai, ativa: body.ativa });
        });
        this.http.route("put", "/areas/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.CONFIGURACOES_EDITAR, SO_DIRETOR);
            return new SalvarArea(f).execute({
                codigo: params.codigo, nome: body.nome, codigoAreaPai: body.codigoAreaPai, ativa: body.ativa,
            });
        });

        this.http.route("get", "/cargos", true, async () => f.criarCargoRepository().listar());
        this.http.route("post", "/cargos", true, async (_p: any, body: any) => {
            exigirPermissao(body.user, Permissao.CONFIGURACOES_EDITAR, SO_DIRETOR);
            return new SalvarCargo(f).execute({ nome: body.nome, ativo: body.ativo });
        });
        this.http.route("put", "/cargos/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.CONFIGURACOES_EDITAR, SO_DIRETOR);
            return new SalvarCargo(f).execute({ codigo: params.codigo, nome: body.nome, ativo: body.ativo });
        });

        this.http.route("post", "/senioridades", true, async (_p: any, body: any) => {
            exigirPermissao(body.user, Permissao.CONFIGURACOES_EDITAR, SO_DIRETOR);
            return new SalvarSenioridade(f).execute({ nome: body.nome, ordem: lerInteiro(body.ordem, "ordem") });
        });
        this.http.route("put", "/senioridades/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.CONFIGURACOES_EDITAR, SO_DIRETOR);
            return new SalvarSenioridade(f).execute({ codigo: params.codigo, nome: body.nome, ordem: lerInteiro(body.ordem, "ordem") });
        });

        this.http.route("get", "/habilidades", true, async () => f.criarHabilidadeRepository().listar());
    }
}
