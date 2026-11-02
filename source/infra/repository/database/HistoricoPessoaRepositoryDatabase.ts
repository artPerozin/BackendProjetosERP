import Area from "../../../domain/Entity/Area";
import Cargo from "../../../domain/Entity/Cargo";
import HistoricoPessoaRepositoryInterface, {
    MudancaArea,
    MudancaCargo,
} from "../../../domain/Interfaces/HistoricoPessoaRepositoryInterface";
import ConexaoBanco from "../../database/ConexaoBanco";
import { dataParaSql } from "../../database/conversoes";

export default class HistoricoPessoaRepositoryDatabase implements HistoricoPessoaRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async registrarCargo(m: MudancaCargo): Promise<void> {
        await this.conexao.consultar(
            `INSERT INTO historico_cargos (usuario_codigo, cargo_anterior_codigo, cargo_novo_codigo, data_vigencia, registrado_por)
             VALUES ($1, $2, $3, $4, $5)`,
            [m.codigoUsuario, m.cargoAnterior?.codigo ?? null, m.cargoNovo?.codigo ?? null, dataParaSql(m.dataVigencia), m.codigoRegistradoPor],
        );
    }

    async registrarArea(m: MudancaArea): Promise<void> {
        await this.conexao.consultar(
            `INSERT INTO historico_areas (usuario_codigo, area_anterior_codigo, area_nova_codigo, data_vigencia, registrado_por)
             VALUES ($1, $2, $3, $4, $5)`,
            [m.codigoUsuario, m.areaAnterior?.codigo ?? null, m.areaNova?.codigo ?? null, dataParaSql(m.dataVigencia), m.codigoRegistradoPor],
        );
    }

    async listarCargos(codigoUsuario: string): Promise<MudancaCargo[]> {
        const linhas = await this.conexao.consultar(
            `SELECT h.codigo, h.usuario_codigo, h.data_vigencia, h.registrado_por, h.registrado_em,
                    ca.codigo AS ant_codigo, ca.nome AS ant_nome, ca.ativo AS ant_ativo,
                    cn.codigo AS novo_codigo, cn.nome AS novo_nome, cn.ativo AS novo_ativo
             FROM historico_cargos h
             LEFT JOIN cargos ca ON ca.codigo = h.cargo_anterior_codigo
             LEFT JOIN cargos cn ON cn.codigo = h.cargo_novo_codigo
             WHERE h.usuario_codigo = $1
             ORDER BY h.data_vigencia DESC, h.registrado_em DESC`,
            [codigoUsuario],
        );
        return linhas.map((l) => ({
            codigo: l.codigo,
            codigoUsuario: l.usuario_codigo,
            cargoAnterior: l.ant_codigo ? new Cargo(l.ant_nome, l.ant_ativo, l.ant_codigo) : null,
            cargoNovo: l.novo_codigo ? new Cargo(l.novo_nome, l.novo_ativo, l.novo_codigo) : null,
            dataVigencia: l.data_vigencia,
            codigoRegistradoPor: l.registrado_por,
            registradoEm: l.registrado_em,
        }));
    }

    async listarAreas(codigoUsuario: string): Promise<MudancaArea[]> {
        const linhas = await this.conexao.consultar(
            `SELECT h.codigo, h.usuario_codigo, h.data_vigencia, h.registrado_por, h.registrado_em,
                    aa.codigo AS ant_codigo, aa.nome AS ant_nome, aa.area_pai_codigo AS ant_pai, aa.ativa AS ant_ativa,
                    an.codigo AS nova_codigo, an.nome AS nova_nome, an.area_pai_codigo AS nova_pai, an.ativa AS nova_ativa
             FROM historico_areas h
             LEFT JOIN areas aa ON aa.codigo = h.area_anterior_codigo
             LEFT JOIN areas an ON an.codigo = h.area_nova_codigo
             WHERE h.usuario_codigo = $1
             ORDER BY h.data_vigencia DESC, h.registrado_em DESC`,
            [codigoUsuario],
        );
        return linhas.map((l) => ({
            codigo: l.codigo,
            codigoUsuario: l.usuario_codigo,
            areaAnterior: l.ant_codigo ? new Area(l.ant_nome, l.ant_pai, l.ant_ativa, l.ant_codigo) : null,
            areaNova: l.nova_codigo ? new Area(l.nova_nome, l.nova_pai, l.nova_ativa, l.nova_codigo) : null,
            dataVigencia: l.data_vigencia,
            codigoRegistradoPor: l.registrado_por,
            registradoEm: l.registrado_em,
        }));
    }
}
