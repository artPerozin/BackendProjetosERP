import Area from "../Entity/Area";
import Cargo from "../Entity/Cargo";

export interface MudancaCargo {
    codigo?: string;
    codigoUsuario: string;
    cargoAnterior: Cargo | null;
    cargoNovo: Cargo | null;
    dataVigencia: Date;
    codigoRegistradoPor: string | null;
    registradoEm?: Date;
}

export interface MudancaArea {
    codigo?: string;
    codigoUsuario: string;
    areaAnterior: Area | null;
    areaNova: Area | null;
    dataVigencia: Date;
    codigoRegistradoPor: string | null;
    registradoEm?: Date;
}

/** Histórico de cargo e de área (RF-014, RN-02). Só acrescenta; nunca altera o passado. */
export default interface HistoricoPessoaRepositoryInterface {
    registrarCargo(mudanca: MudancaCargo): Promise<void>;
    registrarArea(mudanca: MudancaArea): Promise<void>;
    listarCargos(codigoUsuario: string): Promise<MudancaCargo[]>;
    listarAreas(codigoUsuario: string): Promise<MudancaArea[]>;
}
