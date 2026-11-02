import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import StatusPessoa from "../../domain/Enum/StatusPessoa";
import AlterarStatusPessoa from "../Pessoas/AlterarStatusPessoa";

/** Mantido por compatibilidade com DELETE /usuarios/:codigo: muda o status para Inativo. */
export default class InativarUsuario {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(codigo: string): Promise<void> {
        await new AlterarStatusPessoa(this.factory).execute({ codigo, status: StatusPessoa.INATIVO });
    }
}
