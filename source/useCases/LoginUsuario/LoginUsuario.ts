import { compare } from "bcrypt";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import UsuarioRepositoryInterface from "../../domain/Interfaces/UsuarioRepositoryInterface";
import LoginUsuarioInput from "./LoginUsuarioInput";
import LoginUsuarioOutput from "./LoginUsuarioOutput";
import { emitirSessao } from "../Sessao/emitirSessao";
import { ErroNaoAutorizado } from "../../shared/erros/ErroNaoAutorizado";

export const MENSAGEM_CREDENCIAIS_INVALIDAS = "Credenciais inválidas";

/** RF-001: login por e-mail e senha, com token de acesso e refresh token. */
export default class LoginUsuario {
    readonly usuarioRepository: UsuarioRepositoryInterface;

    constructor(private readonly repositoryFactory: RepositoryFactoryInterface) {
        this.usuarioRepository = repositoryFactory.criarUsuarioRepository();
    }

    async execute(input: LoginUsuarioInput): Promise<LoginUsuarioOutput> {
        const email = String(input.email ?? "").trim().toLowerCase();
        const usuario = await this.usuarioRepository.buscarPorEmail(email);
        // Mesma mensagem para e-mail inexistente, senha errada e pessoa sem acesso (CT-001).
        if (!usuario || !usuario.ativo || !usuario.senha) {
            throw new ErroNaoAutorizado(MENSAGEM_CREDENCIAIS_INVALIDAS);
        }
        const senhaConfere = await compare(String(input.senha ?? ""), usuario.senha);
        if (!senhaConfere) {
            throw new ErroNaoAutorizado(MENSAGEM_CREDENCIAIS_INVALIDAS);
        }
        return emitirSessao(this.repositoryFactory, usuario);
    }
}
