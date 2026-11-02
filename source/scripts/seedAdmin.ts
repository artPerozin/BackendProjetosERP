import { config } from "dotenv";
import { Pool } from "pg";
import { hash } from "bcrypt";
import { stringConexao } from "../infra/database/stringConexao";

config();

async function seedAdmin(): Promise<void> {
    const nome = process.env.ADMIN_NAME;
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const senha = process.env.ADMIN_PASSWORD;

    if (!nome || !email || !senha) {
        throw new Error(
            "Configure ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no .env.",
        );
    }

    if (senha.length < 6) {
        throw new Error("A senha deve possuir pelo menos 6 caracteres.");
    }

    const pool = new Pool({ connectionString: stringConexao() });

    try {
        const existente = await pool.query(
            `SELECT codigo FROM usuarios
             WHERE LOWER(email) = LOWER($1)
             LIMIT 1`,
            [email],
        );

        if (existente.rowCount && existente.rowCount > 0) {
            console.log(`O usuário ${email} já está cadastrado.`);
            return;
        }

        const senhaHash = await hash(senha, 10);

        await pool.query(
            `INSERT INTO usuarios (
                codigo,
                nome,
                email,
                perfil,
                senioridade_codigo,
                ativo,
                senha_hash
            ) VALUES (
                gen_random_uuid(),
                $1,
                $2,
                'diretor',
                NULL,
                TRUE,
                $3
            )`,
            [nome, email, senhaHash],
        );

        console.log(`Administrador ${email} criado com sucesso.`);
    } finally {
        await pool.end();
    }
}

seedAdmin().catch((erro: unknown) => {
    console.error("Erro ao criar administrador:", erro);
    process.exitCode = 1;
});