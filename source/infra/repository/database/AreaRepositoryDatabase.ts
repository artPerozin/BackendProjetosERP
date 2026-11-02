import Area from "../../../domain/Entity/Area";
import AreaRepositoryInterface from "../../../domain/Interfaces/AreaRepositoryInterface";
import ConexaoBanco from "../../database/ConexaoBanco";
import { violacaoDeUnicidade } from "../../database/conversoes";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

const SELECT = "SELECT codigo, nome, area_pai_codigo, ativa FROM areas";

export default class AreaRepositoryDatabase implements AreaRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async listar(): Promise<Area[]> {
        const linhas = await this.conexao.consultar(`${SELECT} ORDER BY nome`);
        return linhas.map(paraEntidade);
    }

    async buscarPorCodigo(codigo: string): Promise<Area | null> {
        const linhas = await this.conexao.consultar(`${SELECT} WHERE codigo = $1`, [codigo]);
        return linhas.length ? paraEntidade(linhas[0]) : null;
    }

    async criar(area: Area): Promise<Area> {
        await this.executar(
            "INSERT INTO areas (codigo, nome, area_pai_codigo, ativa) VALUES ($1, $2, $3, $4)",
            [area.codigo, area.nome, area.codigoAreaPai, area.ativa],
        );
        return area;
    }

    async editar(area: Area): Promise<Area> {
        const linhas = await this.executar(
            "UPDATE areas SET nome = $2, area_pai_codigo = $3, ativa = $4 WHERE codigo = $1 RETURNING codigo",
            [area.codigo, area.nome, area.codigoAreaPai, area.ativa],
        );
        if (linhas.length === 0) throw new ErroNaoEncontrado("Área não encontrada.");
        return area;
    }

    private async executar(sql: string, parametros: unknown[]): Promise<any[]> {
        try {
            return await this.conexao.consultar(sql, parametros);
        } catch (erro) {
            if (violacaoDeUnicidade(erro)) throw new ErroConflito("Já existe uma área com esse nome.", "AREA_DUPLICADA");
            throw erro;
        }
    }
}

function paraEntidade(linha: any): Area {
    return new Area(linha.nome, linha.area_pai_codigo, linha.ativa, linha.codigo);
}
