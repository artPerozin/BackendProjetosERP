import { hash } from "bcrypt";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import UsuarioRepositoryInterface from "../../domain/Interfaces/UsuarioRepositoryInterface";
import Usuario from "../../domain/Entity/Usuario";
import StatusPessoa, { STATUS_NA_EJ } from "../../domain/Enum/StatusPessoa";
import { hoje } from "../../domain/Entity/Participacao";
import { MENSAGENS_DE_ERRO } from "../../shared/erros/mensagensDeErro";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { resolverPerfilPessoa } from "../Pessoas/dadosPessoa";
import { validarNovaSenha } from "../Sessao/AlterarSenha";
import CriarUsuarioInput from "./CriarUsuarioInput";
import CriarUsuarioOutput from "./CriarUsuarioOutput";

/** RF-010: cadastra uma pessoa. Só diretores e gerentes chegam aqui (ver UsuarioRoutes). */
export default class CriarUsuario {
    readonly usuarioRepository: UsuarioRepositoryInterface;
    private readonly senioridadeRepository;

    constructor(private readonly repositoryFactory: RepositoryFactoryInterface) {
        this.usuarioRepository = repositoryFactory.criarUsuarioRepository();
        this.senioridadeRepository = repositoryFactory.criarSenioridadeRepository();
    }

    async execute(input: CriarUsuarioInput): Promise<CriarUsuarioOutput> {
        validarNovaSenha(input.senha);
        const email = String(input.email ?? "").trim().toLowerCase();
        if (await this.usuarioRepository.buscarPorEmail(email)) {
            throw new ErroValidacao("Já existe um usuário cadastrado com este e-mail.", "EMAIL_JA_CADASTRADO");
        }
        if (!input.senioridade?.codigo) {
            throw new ErroValidacao(MENSAGENS_DE_ERRO.VALIDACAO.SENIORIDADE_OBRIGATORIA, "SENIORIDADE_OBRIGATORIA");
        }
        const senioridade = await this.senioridadeRepository.buscarPorCodigo(input.senioridade.codigo);
        if (!senioridade) {
            throw new ErroNaoEncontrado("Senioridade não encontrada.");
        }

        const status = input.status ?? (input.ativo === false ? StatusPessoa.INATIVO : StatusPessoa.ATIVO);
        if (input.status && !STATUS_NA_EJ.includes(input.status)) {
            throw new ErroValidacao("Uma pessoa nova entra como Ativa ou Trainee.", "STATUS_INICIAL_INVALIDO");
        }

        const detalhes = await resolverPerfilPessoa(this.repositoryFactory, input);
        const usuario = new Usuario(
            String(input.nome ?? "").trim(),
            email,
            input.perfil,
            status !== StatusPessoa.INATIVO,
            await hash(input.senha, 10),
            senioridade,
            undefined,
            { ...detalhes, status, dataEntrada: detalhes.dataEntrada ?? hoje() },
        );

        const criado = await this.usuarioRepository.criar(usuario);
        if (!criado) {
            throw new ErroValidacao("Já existe um usuário cadastrado com este e-mail.", "EMAIL_JA_CADASTRADO");
        }

        // O cargo e a área iniciais abrem o histórico da pessoa (RF-014).
        const historico = this.repositoryFactory.criarHistoricoPessoaRepository();
        const dataVigencia = usuario.dataEntrada ?? hoje();
        if (usuario.cargo) {
            await historico.registrarCargo({
                codigoUsuario: usuario.codigo, cargoAnterior: null, cargoNovo: usuario.cargo,
                dataVigencia, codigoRegistradoPor: input.codigoAutor ?? null,
            });
        }
        if (usuario.area) {
            await historico.registrarArea({
                codigoUsuario: usuario.codigo, areaAnterior: null, areaNova: usuario.area,
                dataVigencia, codigoRegistradoPor: input.codigoAutor ?? null,
            });
        }
        return usuario;
    }
}
