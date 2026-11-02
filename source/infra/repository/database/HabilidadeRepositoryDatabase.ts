import Habilidade from "../../../domain/Entity/Habilidade";
import TipoHabilidade from "../../../domain/Enum/TipoHabilidade";
import HabilidadeRepositoryInterface from "../../../domain/Interfaces/HabilidadeRepositoryInterface";
import ConexaoBanco from "../../database/ConexaoBanco";

export default class HabilidadeRepositoryDatabase implements HabilidadeRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async listar(): Promise<Habilidade[]> {
        const linhas = await this.conexao.consultar("SELECT codigo, nome, tipo FROM habilidades ORDER BY tipo, nome");
        return linhas.map((l) => new Habilidade(l.nome, l.tipo as TipoHabilidade, l.codigo));
    }

    async garantir(nome: string, tipo: TipoHabilidade): Promise<Habilidade> {
        const nova = new Habilidade(nome, tipo);
        // O índice único é (lower(nome), tipo); em caso de conflito, devolve a já existente.
        const linhas = await this.conexao.consultar(
            `WITH inserida AS (
                INSERT INTO habilidades (codigo, nome, tipo) VALUES ($1, $2, $3)
                ON CONFLICT DO NOTHING
                RETURNING codigo, nome, tipo
             )
             SELECT codigo, nome, tipo FROM inserida
             UNION ALL
             SELECT codigo, nome, tipo FROM habilidades WHERE lower(nome) = lower($2) AND tipo = $3
             LIMIT 1`,
            [nova.codigo, nova.nome, tipo],
        );
        const l = linhas[0];
        return new Habilidade(l.nome, l.tipo as TipoHabilidade, l.codigo);
    }
}
