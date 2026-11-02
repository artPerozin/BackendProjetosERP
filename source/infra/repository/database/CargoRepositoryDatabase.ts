import Cargo from "../../../domain/Entity/Cargo";
import CargoRepositoryInterface from "../../../domain/Interfaces/CargoRepositoryInterface";
import ConexaoBanco from "../../database/ConexaoBanco";
import { violacaoDeUnicidade } from "../../database/conversoes";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

const SELECT = "SELECT codigo, nome, ativo FROM cargos";

export default class CargoRepositoryDatabase implements CargoRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async listar(): Promise<Cargo[]> {
        const linhas = await this.conexao.consultar(`${SELECT} ORDER BY nome`);
        return linhas.map(paraEntidade);
    }

    async buscarPorCodigo(codigo: string): Promise<Cargo | null> {
        const linhas = await this.conexao.consultar(`${SELECT} WHERE codigo = $1`, [codigo]);
        return linhas.length ? paraEntidade(linhas[0]) : null;
    }

    async criar(cargo: Cargo): Promise<Cargo> {
        await this.executar(
            "INSERT INTO cargos (codigo, nome, ativo) VALUES ($1, $2, $3)",
            [cargo.codigo, cargo.nome, cargo.ativo],
        );
        return cargo;
    }

    async editar(cargo: Cargo): Promise<Cargo> {
        const linhas = await this.executar(
            "UPDATE cargos SET nome = $2, ativo = $3 WHERE codigo = $1 RETURNING codigo",
            [cargo.codigo, cargo.nome, cargo.ativo],
        );
        if (linhas.length === 0) throw new ErroNaoEncontrado("Cargo não encontrado.");
        return cargo;
    }

    private async executar(sql: string, parametros: unknown[]): Promise<any[]> {
        try {
            return await this.conexao.consultar(sql, parametros);
        } catch (erro) {
            if (violacaoDeUnicidade(erro)) throw new ErroConflito("Já existe um cargo com esse nome.", "CARGO_DUPLICADO");
            throw erro;
        }
    }
}

function paraEntidade(linha: any): Cargo {
    return new Cargo(linha.nome, linha.ativo, linha.codigo);
}
