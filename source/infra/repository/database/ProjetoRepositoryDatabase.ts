import Projeto from "../../../domain/Entity/Projeto";
import ProjetoRepositoryInterface, { FiltroProjetos } from "../../../domain/Interfaces/ProjetoRepositoryInterface";
import ConexaoBanco from "../../database/ConexaoBanco";
import { dataParaSql, dataParaSqlOuNulo, violacaoDeUnicidade } from "../../database/conversoes";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";
import { normalizarBusca } from "../../../shared/texto";
import { carregarProjetos } from "./carregadores";

const COLUNAS = `nome, descricao, data_inicio, data_fim, status, referencia, objetivo, cliente_nome,
    prioridade, progresso, responsavel_codigo, area_codigo, tags`;

function valores(projeto: Projeto): unknown[] {
    return [
        projeto.nome,
        projeto.descricao,
        dataParaSql(projeto.dataInicio),
        dataParaSql(projeto.dataFim),
        projeto.status,
        projeto.referencia,
        projeto.objetivo,
        projeto.clienteNome,
        projeto.prioridade,
        projeto.progresso,
        projeto.responsavel?.codigo ?? null,
        projeto.area?.codigo ?? null,
        projeto.tags,
    ];
}

export default class ProjetoRepositoryDatabase implements ProjetoRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async criar(projeto: Projeto): Promise<Projeto> {
        await this.gravar(async (conexao) => {
            await conexao.consultar(
                `INSERT INTO projetos (codigo, ${COLUNAS})
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                [projeto.codigo, ...valores(projeto)],
            );
            await this.gravarParticipacoes(conexao, projeto);
        });
        return projeto;
    }

    async listar(filtro: FiltroProjetos = {}): Promise<Projeto[]> {
        const condicoes: string[] = [];
        const parametros: unknown[] = [];
        if (filtro.status?.length) {
            parametros.push(filtro.status);
            condicoes.push(`status = ANY($${parametros.length}::status_projeto[])`);
        }
        if (filtro.codigoArea) {
            parametros.push(filtro.codigoArea);
            condicoes.push(`area_codigo = $${parametros.length}`);
        }
        if (filtro.codigoResponsavel) {
            parametros.push(filtro.codigoResponsavel);
            condicoes.push(`responsavel_codigo = $${parametros.length}`);
        }
        const busca = normalizarBusca(filtro.busca);
        if (busca) {
            parametros.push(`%${busca}%`);
            condicoes.push(
                `translate(lower(nome || ' ' || coalesce(referencia, '') || ' ' || coalesce(cliente_nome, '')),
                    'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') LIKE $${parametros.length}`,
            );
        }
        const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
        const linhas = await this.conexao.consultar(
            `SELECT codigo FROM projetos ${where} ORDER BY data_inicio, nome`,
            parametros,
        );
        return this.hidratar(linhas.map((l) => l.codigo));
    }

    async listarPorMembro(codigoUsuario: string): Promise<Projeto[]> {
        const linhas = await this.conexao.consultar(
            `SELECT DISTINCT p.codigo, p.data_inicio, p.nome
             FROM projetos p
             JOIN projeto_membros pm ON pm.projeto_codigo = p.codigo
             WHERE pm.usuario_codigo = $1
             ORDER BY p.data_inicio, p.nome`,
            [codigoUsuario],
        );
        return this.hidratar(linhas.map((l) => l.codigo));
    }

    async buscarPorCodigo(codigo: string): Promise<Projeto | null> {
        const projetos = await carregarProjetos(this.conexao, [codigo]);
        return projetos.get(codigo) ?? null;
    }

    async editar(projeto: Projeto): Promise<Projeto> {
        await this.gravar(async (conexao) => {
            const linhas = await conexao.consultar(
                `UPDATE projetos SET (${COLUNAS}) =
                    ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                 WHERE codigo = $1
                 RETURNING codigo`,
                [projeto.codigo, ...valores(projeto)],
            );
            if (linhas.length === 0) throw new ErroNaoEncontrado("Projeto não encontrado.");
            await this.gravarParticipacoes(conexao, projeto);
        });
        return projeto;
    }

    async excluir(codigo: string): Promise<void> {
        const linhas = await this.conexao.consultar(
            "DELETE FROM projetos WHERE codigo = $1 RETURNING codigo",
            [codigo],
        );
        if (linhas.length === 0) throw new ErroNaoEncontrado("Projeto não encontrado.");
    }

    private async gravar(operacao: (conexao: ConexaoBanco) => Promise<void>): Promise<void> {
        try {
            await this.conexao.transacao(operacao);
        } catch (erro: any) {
            if (violacaoDeUnicidade(erro)) {
                throw new ErroConflito(
                    erro.constraint === "idx_projetos_referencia"
                        ? "Já existe um projeto com esse código."
                        : "A pessoa já participa deste projeto.",
                    "PROJETO_DUPLICADO",
                );
            }
            throw erro;
        }
    }

    /**
     * Insere participações novas e atualiza as existentes. Nunca apaga: quem sai
     * recebe data de saída e continua no histórico (RF-014, RN-01).
     */
    private async gravarParticipacoes(conexao: ConexaoBanco, projeto: Projeto): Promise<void> {
        // Encerra antes de inserir, para que alguém que saiu e voltou não esbarre no índice de participação ativa.
        const ordenadas = [...projeto.participacoes].sort((a, b) => Number(a.ativa) - Number(b.ativa));
        for (const p of ordenadas) {
            await conexao.consultar(
                `INSERT INTO projeto_membros
                    (codigo, projeto_codigo, usuario_codigo, funcao, responsabilidades, alocacao, data_entrada, data_saida)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 ON CONFLICT (codigo) DO UPDATE SET
                    funcao = EXCLUDED.funcao,
                    responsabilidades = EXCLUDED.responsabilidades,
                    alocacao = EXCLUDED.alocacao,
                    data_saida = EXCLUDED.data_saida`,
                [
                    p.codigo,
                    projeto.codigo,
                    p.usuario.codigo,
                    p.funcao,
                    p.responsabilidades,
                    p.alocacao,
                    dataParaSql(p.dataEntrada),
                    dataParaSqlOuNulo(p.dataSaida),
                ],
            );
        }
    }

    private async hidratar(codigos: string[]): Promise<Projeto[]> {
        const projetos = await carregarProjetos(this.conexao, codigos);
        return codigos.map((codigo) => projetos.get(codigo)!);
    }
}
