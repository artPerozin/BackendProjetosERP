import SenioridadeUsuario from "../../../domain/Entity/SenioridadeUsuario";
import SenioridadeRepositoryInterface from "../../../domain/Interfaces/SenioridadeRepositoryInterface";
import ConexaoBanco from "../../database/ConexaoBanco";
import { violacaoDeUnicidade } from "../../database/conversoes";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

export default class SenioridadeRepositoryDatabase implements SenioridadeRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async listar(): Promise<SenioridadeUsuario[]> {
        const linhas = await this.conexao.consultar(
            "SELECT codigo, nome, valor_hora, ordem FROM senioridades ORDER BY ordem, nome",
        );
        return linhas.map((l) => this.paraEntidade(l));
    }

    async buscarPorCodigo(codigo: string): Promise<SenioridadeUsuario | null> {
        const linhas = await this.conexao.consultar(
            "SELECT codigo, nome, valor_hora, ordem FROM senioridades WHERE codigo = $1",
            [codigo],
        );
        return linhas.length > 0 ? this.paraEntidade(linhas[0]) : null;
    }

    async criar(senioridade: SenioridadeUsuario): Promise<SenioridadeUsuario> {
        try {
            await this.conexao.consultar(
                "INSERT INTO senioridades (codigo, nome, valor_hora, ordem) VALUES ($1, $2, $3, $4)",
                [senioridade.codigo, senioridade.nome, senioridade.valorHora, senioridade.ordem],
            );
        } catch (erro) {
            if (violacaoDeUnicidade(erro)) {
                throw new ErroConflito("Já existe uma senioridade com esse código.", "SENIORIDADE_DUPLICADA");
            }
            throw erro;
        }
        return senioridade;
    }

    async editar(senioridade: SenioridadeUsuario): Promise<SenioridadeUsuario> {
        const linhas = await this.conexao.consultar(
            "UPDATE senioridades SET nome = $2, ordem = $3 WHERE codigo = $1 RETURNING codigo, nome, valor_hora, ordem",
            [senioridade.codigo, senioridade.nome, senioridade.ordem],
        );
        if (linhas.length === 0) throw new ErroNaoEncontrado("Senioridade não encontrada.");
        return this.paraEntidade(linhas[0]);
    }

    private paraEntidade(linha: any): SenioridadeUsuario {
        return new SenioridadeUsuario(linha.codigo, linha.nome, Number(linha.valor_hora), Number(linha.ordem ?? 0));
    }
}
