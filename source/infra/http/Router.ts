import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Http from "./Http";
import ModelRoutes from "./Routes/ModelRoutes";
import swaggerSpecification from "./swagger";
import { MODULOS, Modulo, menuDoUsuario, menuOrdenado } from "../../modulos/registro";
import { exigirAutenticado } from "../../shared/seguranca/permissoes";
import { permissoesDoPapel } from "../../shared/seguranca/catalogoPermissoes";

/** Monta as rotas a partir do registro de módulos. */
export default class Router {
    private readonly routes: ModelRoutes[];

    constructor(
        private readonly http: Http,
        repositoryFactory: RepositoryFactoryInterface,
        private readonly modulos: Modulo[] = MODULOS,
    ) {
        this.routes = modulos.flatMap((modulo) => modulo.rotas.map((Rotas) => new Rotas(http, repositoryFactory)));
    }

    init(): void {
        this.http.route("get", "/", false, async () => ({ message: "Bem vindo!" }));

        // Ações liberadas e menu da pessoa logada; o frontend monta a navegação a partir daqui.
        this.http.route("get", "/auth/permissoes", true, async (_p: any, body: any) => {
            const usuario = exigirAutenticado(body.user);
            return {
                perfil: usuario.perfil,
                permissoes: permissoesDoPapel(usuario.perfil),
                modulos: menuDoUsuario(usuario, this.modulos),
                menu: menuOrdenado(usuario, this.modulos),
            };
        });

        this.routes.forEach((routes) => routes.init());
        this.http.swagger(swaggerSpecification);
    }
}
