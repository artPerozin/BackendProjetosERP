import { DetalhesPessoa } from "../../domain/Entity/Usuario";
import Habilidade from "../../domain/Entity/Habilidade";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import StatusPessoa from "../../domain/Enum/StatusPessoa";
import TipoHabilidade from "../../domain/Enum/TipoHabilidade";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/** Campos do perfil como chegam na API (todos opcionais; ausente = não alterar). */
export interface EntradaPerfilPessoa {
    nomeExibicao?: string | null;
    avatarUrl?: string | null;
    telefone?: string | null;
    linkedinUrl?: string | null;
    curso?: string | null;
    semestre?: number | null;
    codigoArea?: string | null;
    codigoCargo?: string | null;
    dataEntrada?: Date | null;
    bio?: string | null;
    /** Nomes de habilidades e tecnologias. Nomes novos são cadastrados automaticamente. */
    habilidades?: Array<string | { nome: string; tipo?: TipoHabilidade }>;
}

/** Converte a entrada da API em DetalhesPessoa, conferindo se área e cargo existem. */
export async function resolverPerfilPessoa(
    factory: RepositoryFactoryInterface,
    entrada: EntradaPerfilPessoa,
): Promise<DetalhesPessoa> {
    const detalhes: DetalhesPessoa = {};
    const copiar = ["nomeExibicao", "avatarUrl", "telefone", "linkedinUrl", "curso", "semestre", "dataEntrada", "bio"] as const;
    for (const campo of copiar) {
        if (entrada[campo] !== undefined) (detalhes as any)[campo] = entrada[campo];
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

    if (entrada.codigoCargo !== undefined) {
        if (entrada.codigoCargo) {
            const cargo = await factory.criarCargoRepository().buscarPorCodigo(entrada.codigoCargo);
            if (!cargo) throw new ErroNaoEncontrado("Cargo não encontrado.");
            detalhes.cargo = cargo;
        } else {
            detalhes.cargo = null;
        }
    }

    if (entrada.habilidades !== undefined) {
        if (!Array.isArray(entrada.habilidades)) {
            throw new ErroValidacao("Habilidades devem ser enviadas como lista.", "HABILIDADES_INVALIDAS");
        }
        if (entrada.habilidades.length > 40) {
            throw new ErroValidacao("Informe no máximo 40 habilidades.", "HABILIDADES_DEMAIS");
        }
        const repositorio = factory.criarHabilidadeRepository();
        const habilidades: Habilidade[] = [];
        for (const item of entrada.habilidades) {
            const nome = typeof item === "string" ? item : item?.nome;
            const tipo = (typeof item === "string" ? undefined : item?.tipo) ?? TipoHabilidade.HABILIDADE;
            if (!nome || !String(nome).trim()) continue;
            const habilidade = await repositorio.garantir(String(nome), tipo);
            if (!habilidades.some((h) => h.codigo === habilidade.codigo)) habilidades.push(habilidade);
        }
        detalhes.habilidades = habilidades;
    }

    return detalhes;
}

export function lerStatusPessoa(valor: unknown): StatusPessoa | undefined {
    if (valor === undefined || valor === null || valor === "") return undefined;
    if (!Object.values(StatusPessoa).includes(valor as StatusPessoa)) {
        throw new ErroValidacao("Status de pessoa inválido. Use ativo, trainee, alumni ou inativo.", "STATUS_PESSOA_INVALIDO");
    }
    return valor as StatusPessoa;
}
