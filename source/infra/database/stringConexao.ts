/** Monta a string de conexão a partir de DATABASE_URL ou das variáveis DB_*. */
export function stringConexao(): string {
    return process.env.DATABASE_URL ?? [
        `postgresql://${encodeURIComponent(process.env.DB_USER ?? "")}`,
        `:${encodeURIComponent(process.env.DB_PASSWORD ?? "")}`,
        `@${process.env.DB_HOST ?? "localhost"}`,
        `:${process.env.DB_PORT ?? "5432"}`,
        `/${process.env.DATABASE ?? "postgres"}`,
    ].join("");
}
