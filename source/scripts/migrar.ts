import { config } from "dotenv";
import { Pool } from "pg";
import { aplicarMigracoes } from "../infra/database/migracoes";
import { stringConexao } from "../infra/database/stringConexao";

config();

async function main(): Promise<void> {
    const pool = new Pool({ connectionString: stringConexao() });
    try {
        await aplicarMigracoes(pool);
    } finally {
        await pool.end();
    }
}

main().catch((erro) => {
    console.error(erro.message ?? erro);
    process.exitCode = 1;
});
