import { DetalhesProjeto } from "../../domain/Entity/Projeto";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import PrioridadeProjeto from "../../domain/Enum/PrioridadeProjeto";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/** Campos opcionais do projeto como chegam na API (ausente = não alterar). */
export interface EntradaDetalhesProjeto {
    referencia?: string | null;
    objetivo?: string | null;
    clienteNome?: string | null;
    prioridade?: PrioridadeProjeto;
    progresso?: number;
    codigoResponsavel?: string | null;
    codigoArea?: string | null;
    tags?: string[];
}

export async function resolverDetalhesProjeto(
    factory: RepositoryFactoryInterface,
    entrada: EntradaDetalhesProjeto,
): Promise<DetalhesProjeto> {
    const detalhes: DetalhesProjeto = {};
    for (const campo of ["referencia", "objetivo", "clienteNome", "prioridade", "progresso"] as const) {
        if (entrada[campo] !== undefined) (detalhes as any)[campo] = entrada[campo];
    }
    if (entrada.tags !== undefined) {
        if (!Array.isArray(entrada.tags) || entrada.tags.length > 20) {
            throw new ErroValidacao("Etiquetas devem ser uma lista com até 20 itens.", "TAGS_INVALIDAS");
        }
        detalhes.tags = entrada.tags;
    }
    if (entrada.codigoResponsavel !== undefined) {
        if (entrada.codigoResponsavel) {
            const responsavel = await factory.criarUsuarioRepository().buscarPorCodigo(entrada.codigoResponsavel);
            if (!responsavel) throw new ErroNaoEncontrado("Responsável não encontrado.");
            if (!responsavel.naEj) {
                throw new ErroValidacao("O responsável precisa estar Ativo ou Trainee.", "RESPONSAVEL_INATIVO");
            }
            detalhes.responsavel = responsavel;
        } else {
            detalhes.responsavel = null;
        }
    }
    if (entrada.codigoArea !== undefined) {
        if (entrada.codigoArea) {
            const area = await factory.criarAreaRepository().buscarPorCodigo(entrada.codigoArea);
            if (!area) throw new ErroNaoEncontrado("Área não encontrada.");
            detalhes.area = area;
        } else {
            detalhes.area = null;
        }
    }
    return detalhes;
}
