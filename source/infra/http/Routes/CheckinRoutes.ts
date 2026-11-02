import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";
import ListarCheckins from "../../../useCases/ListarCheckins/ListarCheckins";
import RegistrarCheckin from "../../../useCases/RegistrarCheckin/RegistrarCheckin";
import EditarCheckin from "../../../useCases/EditarCheckin/EditarCheckin";
import { exigirAutenticado, temPermissao, Permissao } from "../../../shared/seguranca/permissoes";

export default class CheckinRoutes implements ModelRoutes {
    constructor(private readonly http: Http, private readonly factory: RepositoryFactoryInterface) {}

    init(): void {
        // Check-ins têm humor e sentimento: membros veem só os próprios; gestores veem todos.
        this.http.route("get", "/checkins", true, async (_params: any, body: any, query: any) => {
            const usuario = exigirAutenticado(body.user);
            const codigoUsuario = temPermissao(usuario, Permissao.CHECKINS_VER_TODOS) ? query?.codigoUsuario : usuario.codigo;
            return new ListarCheckins(this.factory).execute(codigoUsuario);
        });

        this.http.route("post", "/checkins", true, async (_params: any, body: any) =>
            new RegistrarCheckin(this.factory).execute({
                codigoUsuario: exigirAutenticado(body.user).codigo,
                semana: new Date(body.semana),
                resumo: body.resumo,
                aprendizados: body.aprendizados,
                humor: body.humor === undefined ? undefined : Number(body.humor),
                sentimento: body.sentimento ?? null,
            }));

        this.http.route("put", "/checkins", true, async (_params: any, body: any) =>
            new EditarCheckin(this.factory).execute({
                codigoUsuario: exigirAutenticado(body.user).codigo,
                semana: new Date(body.semana),
                resumo: body.resumo,
                aprendizados: body.aprendizados,
                humor: Number(body.humor),
                sentimento: body.sentimento ?? null,
            }));
    }
}
