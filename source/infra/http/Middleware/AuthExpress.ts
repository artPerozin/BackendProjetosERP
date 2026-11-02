import { verify } from "jsonwebtoken";
import Auth from "./Auth";
import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import UserRepositoryInterface from "../../../domain/Interfaces/UsuarioRepositoryInterface";
import { obterChavePublica } from "../../../shared/seguranca/chavesJwt";

export default class ExpressAuth implements Auth {

    protected userRepository: UserRepositoryInterface;

    constructor(repositoryFactory: RepositoryFactoryInterface) {
        this.userRepository = repositoryFactory.criarUsuarioRepository();
    }

    async execute(request: any, response: any, next: any): Promise<any> {
        if (!request.headers || !request.headers['access-token']) {
            return response.status(401).json({
                message: 'Token de acesso ausente.'
            });
        }
        const token = request.headers['access-token'];
        try {
            const publicKey = obterChavePublica();
            const data = verify(token, publicKey, { algorithms: ["RS256"] }) as { codigo: string };
            const user = await this.userRepository.buscarPorCodigo(data.codigo);

            if (!user || !user.ativo) {
                return response.status(401).json({ message: "Token inválido ou usuário inativo." });
            }

            request.body = request.body ?? {};
            request.body.user = user;
            return next();
        } catch (e) {
            return response.status(401).json({
                message: 'Token inválido ou expirado.'
            });
        }
    }

}