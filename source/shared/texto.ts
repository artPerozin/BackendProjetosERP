/** Normaliza texto para busca: minúsculas, sem acentos e sem espaços nas pontas. */
export function normalizarBusca(texto: string | null | undefined): string {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim();
}

/** Transforma um nome em código: "Sênior Plus" -> "senior_plus". */
export function slug(texto: string | null | undefined): string {
    return normalizarBusca(texto).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 20);
}
