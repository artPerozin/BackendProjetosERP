import { v4 as uuid } from "uuid";
import HistoricoPessoaRepositoryInterface, {
    MudancaArea,
    MudancaCargo,
} from "../../../domain/Interfaces/HistoricoPessoaRepositoryInterface";

export default class HistoricoPessoaRepositoryMemory implements HistoricoPessoaRepositoryInterface {
    private cargos: MudancaCargo[] = [];
    private areas: MudancaArea[] = [];

    async registrarCargo(mudanca: MudancaCargo): Promise<void> {
        this.cargos.push({ ...mudanca, codigo: mudanca.codigo ?? uuid(), registradoEm: mudanca.registradoEm ?? new Date() });
    }

    async registrarArea(mudanca: MudancaArea): Promise<void> {
        this.areas.push({ ...mudanca, codigo: mudanca.codigo ?? uuid(), registradoEm: mudanca.registradoEm ?? new Date() });
    }

    async listarCargos(codigoUsuario: string): Promise<MudancaCargo[]> {
        return this.cargos
            .filter((m) => m.codigoUsuario === codigoUsuario)
            .sort((a, b) => b.dataVigencia.getTime() - a.dataVigencia.getTime());
    }

    async listarAreas(codigoUsuario: string): Promise<MudancaArea[]> {
        return this.areas
            .filter((m) => m.codigoUsuario === codigoUsuario)
            .sort((a, b) => b.dataVigencia.getTime() - a.dataVigencia.getTime());
    }
}
