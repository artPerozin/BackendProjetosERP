import { ErroValidacao } from "./erros/ErroValidacao";

/**
 * Lê uma data vinda da API ("2026-10-29" ou ISO completo) como meia-noite UTC.
 * Vazio vira null; texto inválido gera erro de validação.
 */
export function lerData(valor: unknown, campo = "data"): Date | null {
    if (valor === undefined || valor === null || valor === "") return null;
    if (valor instanceof Date) return valor;
    const texto = String(valor);
    const soData = /^\d{4}-\d{2}-\d{2}$/.test(texto) ? `${texto}T00:00:00.000Z` : texto;
    const data = new Date(soData);
    if (Number.isNaN(data.getTime())) {
        throw new ErroValidacao(`O campo ${campo} deve ser uma data válida.`, "DATA_INVALIDA");
    }
    return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth(), data.getUTCDate()));
}

export function lerDataObrigatoria(valor: unknown, campo: string): Date {
    const data = lerData(valor, campo);
    if (!data) throw new ErroValidacao(`O campo ${campo} é obrigatório.`, "CAMPO_OBRIGATORIO");
    return data;
}

/** Lê uma lista enviada como array ou como texto separado por vírgulas (query string). */
export function lerLista(valor: unknown): string[] {
    if (valor === undefined || valor === null || valor === "") return [];
    const lista = Array.isArray(valor) ? valor : String(valor).split(",");
    return lista.map((item) => String(item).trim()).filter(Boolean);
}

export function lerInteiro(valor: unknown, campo: string): number | undefined {
    if (valor === undefined || valor === null || valor === "") return undefined;
    const numero = Number(valor);
    if (!Number.isFinite(numero)) {
        throw new ErroValidacao(`O campo ${campo} deve ser numérico.`, "NUMERO_INVALIDO");
    }
    return numero;
}

/** Garante que o valor pertence a um enum; vazio vira undefined. */
export function lerEnum<T extends string>(valor: unknown, valores: Record<string, T>, campo: string): T | undefined {
    if (valor === undefined || valor === null || valor === "") return undefined;
    if (!Object.values(valores).includes(valor as T)) {
        throw new ErroValidacao(`Valor inválido para ${campo}: ${String(valor)}.`, "VALOR_INVALIDO");
    }
    return valor as T;
}
