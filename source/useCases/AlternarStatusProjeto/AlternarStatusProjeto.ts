import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Projeto from "../../domain/Entity/Projeto";
import StatusProjeto from "../../domain/Enum/StatusProjeto";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/**
 * RF-021: muda o status do projeto. Sem status informado, alterna entre
 * Em andamento e Concluído (comportamento original da tela).
 */
export default class AlternarStatusProjeto {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(codigo: string, status?: StatusProjeto): Promise<Projeto> {
        const projetos = this.factory.criarProjetoRepository();
        const p = await projetos.buscarPorCodigo(codigo);
        if (!p) throw new ErroNaoEncontrado("Projeto não encontrado.");
        if (status !== undefined && !Object.values(StatusProjeto).includes(status)) {
            throw new ErroValidacao("Status de projeto inválido.", "STATUS_PROJETO_INVALIDO");
        }
        const novo = status ?? (p.status === StatusProjeto.CONCLUIDO ? StatusProjeto.EM_EXECUCAO : StatusProjeto.CONCLUIDO);
        return projetos.editar(p.copiar({ status: novo }));
    }
}
