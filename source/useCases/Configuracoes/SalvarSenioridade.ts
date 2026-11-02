import SenioridadeUsuario from "../../domain/Entity/SenioridadeUsuario";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import { slug } from "../../shared/texto";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/**
 * ADR-007: cria uma senioridade ou altera nome e ordem.
 * O valor-hora fica para a fase 3, com vigência (RF-050, RN-08).
 */
export default class SalvarSenioridade {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: { codigo?: string; nome: string; ordem?: number }): Promise<SenioridadeUsuario> {
        const repo = this.factory.criarSenioridadeRepository();
        const ordem = input.ordem === undefined ? undefined : Number(input.ordem);
        if (ordem !== undefined && (!Number.isInteger(ordem) || ordem < 0 || ordem > 100)) {
            throw new ErroValidacao("A ordem deve ser um número inteiro entre 0 e 100.", "ORDEM_INVALIDA");
        }
        if (input.codigo) {
            const atual = await repo.buscarPorCodigo(input.codigo);
            if (!atual) throw new ErroNaoEncontrado("Senioridade não encontrada.");
            return repo.editar(new SenioridadeUsuario(atual.codigo, String(input.nome ?? "").trim(), atual.valorHora, ordem ?? atual.ordem));
        }
        const nome = String(input.nome ?? "").trim();
        const codigo = slug(nome);
        if (!codigo) throw new ErroValidacao("O nome da senioridade é obrigatório.", "NOME_SENIORIDADE_OBRIGATORIO");
        return repo.criar(new SenioridadeUsuario(codigo, nome, 0, ordem ?? 0));
    }
}
