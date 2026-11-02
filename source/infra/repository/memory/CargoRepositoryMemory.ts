import Cargo from "../../../domain/Entity/Cargo";
import CargoRepositoryInterface from "../../../domain/Interfaces/CargoRepositoryInterface";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

export default class CargoRepositoryMemory implements CargoRepositoryInterface {
    private cargos: Cargo[] = [];

    async listar(): Promise<Cargo[]> {
        return [...this.cargos].sort((a, b) => a.nome.localeCompare(b.nome));
    }

    async buscarPorCodigo(codigo: string): Promise<Cargo | null> {
        return this.cargos.find((c) => c.codigo === codigo) ?? null;
    }

    async criar(cargo: Cargo): Promise<Cargo> {
        this.garantirNomeLivre(cargo);
        this.cargos.push(cargo);
        return cargo;
    }

    async editar(cargo: Cargo): Promise<Cargo> {
        const indice = this.cargos.findIndex((c) => c.codigo === cargo.codigo);
        if (indice === -1) throw new ErroNaoEncontrado("Cargo não encontrado.");
        this.garantirNomeLivre(cargo);
        this.cargos[indice] = cargo;
        return cargo;
    }

    private garantirNomeLivre(cargo: Cargo): void {
        if (this.cargos.some((c) => c.codigo !== cargo.codigo && c.nome.toLowerCase() === cargo.nome.toLowerCase())) {
            throw new ErroConflito("Já existe um cargo com esse nome.", "CARGO_DUPLICADO");
        }
    }
}
