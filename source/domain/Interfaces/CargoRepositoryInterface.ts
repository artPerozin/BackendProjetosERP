import Cargo from "../Entity/Cargo";

export default interface CargoRepositoryInterface {
    listar(): Promise<Cargo[]>;
    buscarPorCodigo(codigo: string): Promise<Cargo | null>;
    criar(cargo: Cargo): Promise<Cargo>;
    editar(cargo: Cargo): Promise<Cargo>;
}
