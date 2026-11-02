import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Usuario from "../../domain/Entity/Usuario";
import { hoje } from "../../domain/Entity/Participacao";
import { calcularAlocacao, ResumoAlocacao } from "../../domain/Service/alocacao";
import { MudancaArea, MudancaCargo } from "../../domain/Interfaces/HistoricoPessoaRepositoryInterface";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";

export interface ProjetoNoPerfil {
    codigo: string;
    nome: string;
    referencia: string | null;
    status: string;
    funcao: string | null;
    alocacao: number;
    dataEntrada: Date;
    dataSaida: Date | null;
}

export interface CapacitacaoNoPerfil {
    codigo: string;
    titulo: string;
    data: Date;
    hora: string;
    papel: "instrutor" | "participante";
}

export interface PerfilPessoa {
    usuario: Usuario;
    projetosAtuais: ProjetoNoPerfil[];
    projetosAnteriores: ProjetoNoPerfil[];
    historico: { cargos: MudancaCargo[]; areas: MudancaArea[] };
    capacitacoes: { proximas: CapacitacaoNoPerfil[]; realizadas: CapacitacaoNoPerfil[] };
    alocacao: ResumoAlocacao;
}

/** RF-013: perfil com projetos atuais e anteriores, habilidades, histórico e capacitações. */
export default class ObterPerfilPessoa {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(codigo: string): Promise<PerfilPessoa> {
        const usuario = await this.factory.criarUsuarioRepository().buscarPorCodigo(codigo);
        if (!usuario) throw new ErroNaoEncontrado("Pessoa não encontrada.");

        const projetos = await this.factory.criarProjetoRepository().listarPorMembro(codigo);
        const projetosAtuais: ProjetoNoPerfil[] = [];
        const projetosAnteriores: ProjetoNoPerfil[] = [];
        for (const projeto of projetos) {
            for (const p of projeto.participacoes.filter((x) => x.usuario.codigo === codigo)) {
                const item: ProjetoNoPerfil = {
                    codigo: projeto.codigo,
                    nome: projeto.nome,
                    referencia: projeto.referencia,
                    status: projeto.status,
                    funcao: p.funcao,
                    alocacao: p.alocacao,
                    dataEntrada: p.dataEntrada,
                    dataSaida: p.dataSaida,
                };
                (p.ativa ? projetosAtuais : projetosAnteriores).push(item);
            }
        }
        projetosAnteriores.sort((a, b) => (b.dataSaida?.getTime() ?? 0) - (a.dataSaida?.getTime() ?? 0));

        const historicoRepo = this.factory.criarHistoricoPessoaRepository();
        const historico = {
            cargos: await historicoRepo.listarCargos(codigo),
            areas: await historicoRepo.listarAreas(codigo),
        };

        const hojeMs = hoje().getTime();
        const proximas: CapacitacaoNoPerfil[] = [];
        const realizadas: CapacitacaoNoPerfil[] = [];
        for (const c of await this.factory.criarCapacitacaoRepository().listar()) {
            const instrutor = c.instrutor?.codigo === codigo;
            const participante = c.inscritos.some((i) => i.codigo === codigo);
            if (!instrutor && !participante) continue;
            const item: CapacitacaoNoPerfil = {
                codigo: c.codigo, titulo: c.titulo, data: c.data, hora: c.hora,
                papel: instrutor ? "instrutor" : "participante",
            };
            (c.data.getTime() >= hojeMs ? proximas : realizadas).push(item);
        }
        proximas.sort((a, b) => a.data.getTime() - b.data.getTime());
        realizadas.sort((a, b) => b.data.getTime() - a.data.getTime());

        return {
            usuario,
            projetosAtuais,
            projetosAnteriores,
            historico,
            capacitacoes: { proximas, realizadas },
            alocacao: calcularAlocacao(projetos, codigo),
        };
    }
}
