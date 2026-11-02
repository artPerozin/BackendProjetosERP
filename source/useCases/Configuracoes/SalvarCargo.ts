import Cargo from "../../domain/Entity/Cargo";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";

/** ADR-007: cria ou edita um cargo. Cargos não são excluídos, só desativados. */
export default class SalvarCargo {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: { codigo?: string; nome: string; ativo?: boolean }): Promise<Cargo> {
        const repo = this.factory.criarCargoRepository();
        const atual = input.codigo ? await repo.buscarPorCodigo(input.codigo) : null;
        if (input.codigo && !atual) throw new ErroNaoEncontrado("Cargo não encontrado.");
        const cargo = new Cargo(input.nome, input.ativo ?? atual?.ativo ?? true, atual?.codigo);
        return atual ? repo.editar(cargo) : repo.criar(cargo);
    }
}
