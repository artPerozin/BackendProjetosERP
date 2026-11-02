import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";
import SenioridadeUsuario from "../../../domain/Entity/SenioridadeUsuario";
import PerfilUsuario from "../../../domain/Enum/PerfilUsuario";
import StatusPessoa from "../../../domain/Enum/StatusPessoa";
import LoginUsuario from "../../../useCases/LoginUsuario/LoginUsuario";
import RenovarSessao from "../../../useCases/Sessao/RenovarSessao";
import EncerrarSessao from "../../../useCases/Sessao/EncerrarSessao";
import AlterarSenha from "../../../useCases/Sessao/AlterarSenha";
import CriarUsuario from "../../../useCases/CriarUsuario/CriarUsuario";
import EditarUsuario from "../../../useCases/EditarUsuario/EditarUsuario";
import ListarUsuarios from "../../../useCases/ListarUsuarios/ListarUsuarios";
import AlterarStatusPessoa from "../../../useCases/Pessoas/AlterarStatusPessoa";
import ObterPerfilPessoa from "../../../useCases/Pessoas/ObterPerfilPessoa";
import { EntradaPerfilPessoa, lerStatusPessoa } from "../../../useCases/Pessoas/dadosPessoa";
import { exigirAutenticado, exigirPodeGerirPerfil } from "../../../shared/seguranca/permissoes";
import { lerData, lerEnum, lerInteiro, lerLista } from "../../../shared/entradas";
import { ErroProibido } from "../../../shared/erros/ErroProibido";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

/** Lê a senioridade enviada como objeto ({ codigo }) ou como texto (codigoSenioridade). */
function lerSenioridade(body: any): SenioridadeUsuario | null {
    const codigo = body.codigoSenioridade ?? body.senioridade?.codigo ?? (typeof body.senioridade === "string" ? body.senioridade : null);
    return codigo ? new SenioridadeUsuario(String(codigo), String(body.senioridade?.nome ?? codigo), 0) : null;
}

/** Campos do perfil presentes no corpo; ausentes ficam undefined (não alteram). */
function lerPerfil(body: any): EntradaPerfilPessoa {
    const texto = (campo: string) => (body[campo] === undefined ? undefined : body[campo]);
    return {
        nomeExibicao: texto("nomeExibicao"),
        avatarUrl: texto("avatarUrl"),
        telefone: texto("telefone"),
        linkedinUrl: texto("linkedinUrl"),
        curso: texto("curso"),
        semestre: body.semestre === undefined ? undefined : body.semestre === null || body.semestre === "" ? null : lerInteiro(body.semestre, "semestre"),
        codigoArea: texto("codigoArea"),
        codigoCargo: texto("codigoCargo"),
        dataEntrada: body.dataEntrada === undefined ? undefined : lerData(body.dataEntrada, "dataEntrada"),
        bio: texto("bio"),
        habilidades: body.habilidades,
    };
}

/** Rotas de sessão (RF-001) e de pessoas (RF-010 a RF-016). */
export default class UsuarioRoutes implements ModelRoutes {
    constructor(
        readonly http: Http,
        private readonly repositoryFactory: RepositoryFactoryInterface,
    ) {}

    private async buscarAlvo(codigo: string) {
        const alvo = await this.repositoryFactory.criarUsuarioRepository().buscarPorCodigo(codigo);
        if (!alvo) throw new ErroNaoEncontrado("Usuário não encontrado.");
        return alvo;
    }

    init(): void {
        const f = this.repositoryFactory;

        // Sessão. Não há cadastro público: contas são criadas por diretores e gerentes.
        this.http.route("post", "/auth/login", false, async (_p: any, body: any) =>
            new LoginUsuario(f).execute({ email: body.email, senha: body.senha }));

        this.http.route("post", "/auth/refresh", false, async (_p: any, body: any) =>
            new RenovarSessao(f).execute(body.refreshToken));

        this.http.route("post", "/auth/logout", false, async (_p: any, body: any) => {
            await new EncerrarSessao(f).execute(body.refreshToken);
            return { message: "Sessão encerrada." };
        });

        this.http.route("get", "/auth/me", true, async (_p: any, body: any) =>
            this.buscarAlvo(exigirAutenticado(body.user).codigo));

        this.http.route("put", "/auth/senha", true, async (_p: any, body: any) => {
            await new AlterarSenha(f).execute({
                codigoUsuario: exigirAutenticado(body.user).codigo,
                senhaAtual: body.senhaAtual,
                novaSenha: body.novaSenha,
                exigirSenhaAtual: true,
            });
            return { message: "Senha alterada. Entre novamente nos outros dispositivos." };
        });

        // A própria pessoa edita só os dados de contato e apresentação; o resto é com a gestão.
        this.http.route("put", "/auth/perfil", true, async (_p: any, body: any) => {
            const eu = exigirAutenticado(body.user);
            const { nomeExibicao, telefone, linkedinUrl, curso, semestre, bio } = lerPerfil(body);
            return new EditarUsuario(f).execute({
                codigo: eu.codigo,
                nomeExibicao, telefone, linkedinUrl, curso, semestre, bio,
                codigoAutor: eu.codigo,
            });
        });

        // Pessoas: todos os autenticados consultam; só gestores alteram (matriz de permissões).
        this.http.route("get", "/usuarios", true, async (_p: any, _b: any, query: any) =>
            new ListarUsuarios(f).execute({
                status: lerLista(query?.status).map((s) => lerStatusPessoa(s)!),
                codigoArea: query?.codigoArea || undefined,
                busca: query?.busca || undefined,
            }));

        this.http.route("get", "/usuarios/:codigo", true, async (params: any) => this.buscarAlvo(params.codigo));

        this.http.route("get", "/usuarios/:codigo/perfil", true, async (params: any) =>
            new ObterPerfilPessoa(f).execute(params.codigo));

        this.http.route("get", "/senioridades", true, async () => f.criarSenioridadeRepository().listar());

        this.http.route("post", "/usuarios", true, async (_p: any, body: any) => {
            const perfil = lerEnum(body.perfil, PerfilUsuario, "perfil") ?? PerfilUsuario.MEMBRO;
            const gestor = exigirPodeGerirPerfil(body.user, null, perfil);
            return new CriarUsuario(f).execute({
                nome: body.nome,
                email: body.email,
                senha: body.senha,
                perfil,
                senioridade: lerSenioridade(body),
                status: lerStatusPessoa(body.status),
                codigoAutor: gestor.codigo,
                ...lerPerfil(body),
            });
        });

        this.http.route("put", "/usuarios/:codigo", true, async (params: any, body: any) => {
            const alvo = await this.buscarAlvo(params.codigo);
            const perfil = lerEnum(body.perfil, PerfilUsuario, "perfil") ?? alvo.perfil;
            const gestor = exigirPodeGerirPerfil(body.user, alvo.perfil, perfil);
            if (gestor.codigo === alvo.codigo && perfil !== alvo.perfil) {
                throw new ErroProibido("Você não pode alterar o próprio perfil de acesso.");
            }
            return new EditarUsuario(f).execute({
                codigo: alvo.codigo,
                nome: body.nome ?? alvo.nome,
                email: body.email ?? alvo.email,
                perfil,
                senioridade: lerSenioridade(body),
                dataVigencia: lerData(body.dataVigencia, "dataVigencia"),
                codigoAutor: gestor.codigo,
                ...lerPerfil(body),
            });
        });

        this.http.route("patch", "/usuarios/:codigo/status", true, async (params: any, body: any) => {
            const alvo = await this.buscarAlvo(params.codigo);
            const gestor = exigirPodeGerirPerfil(body.user, alvo.perfil, alvo.perfil);
            if (gestor.codigo === alvo.codigo) throw new ErroProibido("Você não pode alterar o próprio status.");
            return new AlterarStatusPessoa(f).execute({
                codigo: alvo.codigo,
                status: lerStatusPessoa(body.status)!,
                dataSaida: lerData(body.dataSaida, "dataSaida"),
                encerrarParticipacoes: body.encerrarParticipacoes !== false,
            });
        });

        this.http.route("put", "/usuarios/:codigo/senha", true, async (params: any, body: any) => {
            const alvo = await this.buscarAlvo(params.codigo);
            exigirPodeGerirPerfil(body.user, alvo.perfil, alvo.perfil);
            await new AlterarSenha(f).execute({ codigoUsuario: alvo.codigo, novaSenha: body.novaSenha, exigirSenhaAtual: false });
            return { message: "Senha redefinida." };
        });

        // Compatibilidade: DELETE não exclui, só muda o status para Inativo (ADR-006).
        this.http.route("delete", "/usuarios/:codigo", true, async (params: any, body: any) => {
            const alvo = await this.buscarAlvo(params.codigo);
            const gestor = exigirPodeGerirPerfil(body.user, alvo.perfil, alvo.perfil);
            if (gestor.codigo === alvo.codigo) throw new ErroProibido("Você não pode inativar a própria conta.");
            await new AlterarStatusPessoa(f).execute({ codigo: alvo.codigo, status: StatusPessoa.INATIVO });
            return { message: "Pessoa inativada. O histórico foi preservado." };
        });
    }
}
