import Projeto from "../Entity/Projeto";

export const LIMITE_ALOCACAO = 100;

export interface ResumoAlocacao {
    codigoUsuario: string;
    /** Soma da alocação nas participações em aberto de projetos ativos. */
    total: number;
    excedeu: boolean;
    projetos: Array<{ codigo: string; nome: string; alocacao: number }>;
}

/**
 * RN-04: a alocação total de uma pessoa em projetos ativos acima de 100% gera alerta,
 * mas não bloqueia. Projetos ativos: Em andamento, Atenção e Bloqueado (QA-35, proposta).
 */
export function calcularAlocacao(projetos: Projeto[], codigoUsuario: string): ResumoAlocacao {
    const itens = projetos
        .filter((p) => p.ativo)
        .map((p) => ({ projeto: p, participacao: p.participacaoAtivaDe(codigoUsuario) }))
        .filter((x) => x.participacao)
        .map((x) => ({ codigo: x.projeto.codigo, nome: x.projeto.nome, alocacao: x.participacao!.alocacao }));
    const total = itens.reduce((soma, item) => soma + item.alocacao, 0);
    return { codigoUsuario, total, excedeu: total > LIMITE_ALOCACAO, projetos: itens };
}
