import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";
import ListarPastas from "../../../useCases/ListarPastas/ListarPastas";
import CriarPasta from "../../../useCases/CriarPasta/CriarPasta";
import RenomearPasta from "../../../useCases/RenomearPasta/RenomearPasta";
import ExcluirPasta from "../../../useCases/ExcluirPasta/ExcluirPasta";
import { exigirPermissao, Permissao } from "../../../shared/seguranca/permissoes";

export default class PastaRoutes implements ModelRoutes {
    constructor(private readonly http: Http, private readonly factory: RepositoryFactoryInterface) {}

    init(): void {
        this.http.route("get", "/pastas", true, async () =>
            new ListarPastas(this.factory).execute());

        this.http.route("post", "/pastas", true, async (_params: any, body: any) => {
            exigirPermissao(body.user, Permissao.DOCUMENTOS_GERIR);
            return new CriarPasta(this.factory).execute(body.nome);
        });

        this.http.route("put", "/pastas/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.DOCUMENTOS_GERIR);
            return new RenomearPasta(this.factory).execute(params.codigo, body.nome);
        });

        this.http.route("delete", "/pastas/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.DOCUMENTOS_GERIR);
            return new ExcluirPasta(this.factory).execute(params.codigo);
        });
    }
}
