import Usuario from "../../../domain/Entity/Usuario";
import UsuarioRepositoryInterface, { FiltroPessoas } from "../../../domain/Interfaces/UsuarioRepositoryInterface";
import StatusPessoa from "../../../domain/Enum/StatusPessoa";
import ConexaoBanco from "../../database/ConexaoBanco";
import { dataParaSqlOuNulo, violacaoDeUnicidade } from "../../database/conversoes";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";
import { normalizarBusca } from "../../../shared/texto";
import { SELECT_USUARIO, usuarioDeLinha } from "./carregadores";

const COLUNAS = `nome, email, perfil, senioridade_codigo, ativo, senha_hash, status,
    nome_exibicao, avatar_url, telefone, linkedin_url, curso, semestre,
    area_codigo, cargo_codigo, data_entrada, data_saida, bio`;

function valores(usuario: Usuario): unknown[] {
    return [
        usuario.nome,
        usuario.email,
        usuario.perfil,
        usuario.senioridade?.codigo ?? null,
        usuario.ativo,
        usuario.senha,
        usuario.status,
        usuario.nomeExibicao,
        usuario.avatarUrl,
        usuario.telefone,
        usuario.linkedinUrl,
        usuario.curso,
        usuario.semestre,
        usuario.area?.codigo ?? null,
        usuario.cargo?.codigo ?? null,
        dataParaSqlOuNulo(usuario.dataEntrada),
        dataParaSqlOuNulo(usuario.dataSaida),
        usuario.bio,
    ];
}

export default class UsuarioRepositoryDatabase implements UsuarioRepositoryInterface {
    constructor(private readonly conexao: ConexaoBanco) {}

    async criar(usuario: Usuario): Promise<Usuario | null> {
        return this.conexao.transacao(async (conexao) => {
            const linhas = await conexao.consultar(
                `INSERT INTO usuarios (codigo, ${COLUNAS})
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                 ON CONFLICT DO NOTHING
                 RETURNING codigo`,
                [usuario.codigo, ...valores(usuario)],
            );
            if (linhas.length === 0) return null;
            await this.gravarHabilidades(conexao, usuario);
            return usuario;
        });
    }

    async listar(filtro: FiltroPessoas = {}): Promise<Usuario[]> {
        const condicoes: string[] = [];
        const parametros: unknown[] = [];
        if (filtro.status?.length) {
            parametros.push(filtro.status);
            condicoes.push(`u.status = ANY($${parametros.length}::status_pessoa[])`);
        }
        if (filtro.codigoArea) {
            parametros.push(filtro.codigoArea);
            condicoes.push(`u.area_codigo = $${parametros.length}`);
        }
        const busca = normalizarBusca(filtro.busca);
        if (busca) {
            parametros.push(`%${busca}%`);
            condicoes.push(
                `translate(lower(u.nome || ' ' || coalesce(u.nome_exibicao, '') || ' ' || u.email),
                    'áàâãäéèêëíìîïóòôõöúùûüç', 'aaaaaeeeeiiiiooooouuuuc') LIKE $${parametros.length}`,
            );
        }
        const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";
        const linhas = await this.conexao.consultar(`${SELECT_USUARIO} ${where} ORDER BY u.nome`, parametros);
        return linhas.map(usuarioDeLinha);
    }

    async buscarPorCodigo(codigo: string): Promise<Usuario | null> {
        const linhas = await this.conexao.consultar(`${SELECT_USUARIO} WHERE u.codigo = $1`, [codigo]);
        return linhas.length > 0 ? usuarioDeLinha(linhas[0]) : null;
    }

    async buscarPorEmail(email: string): Promise<Usuario | null> {
        const linhas = await this.conexao.consultar(
            `${SELECT_USUARIO} WHERE lower(u.email) = lower($1)`,
            [email.trim()],
        );
        return linhas.length > 0 ? usuarioDeLinha(linhas[0]) : null;
    }

    async editar(usuario: Usuario): Promise<Usuario> {
        try {
            await this.conexao.transacao(async (conexao) => {
                const linhas = await conexao.consultar(
                    `UPDATE usuarios SET (${COLUNAS}) =
                        ($2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
                     WHERE codigo = $1
                     RETURNING codigo`,
                    [usuario.codigo, ...valores(usuario)],
                );
                if (linhas.length === 0) throw new ErroNaoEncontrado("Usuário não encontrado.");
                await conexao.consultar("DELETE FROM usuario_habilidades WHERE usuario_codigo = $1", [usuario.codigo]);
                await this.gravarHabilidades(conexao, usuario);
            });
        } catch (erro) {
            if (violacaoDeUnicidade(erro)) {
                throw new ErroConflito("Este e-mail já está cadastrado.", "EMAIL_JA_CADASTRADO");
            }
            throw erro;
        }
        return usuario;
    }

    async desativar(codigo: string): Promise<void> {
        const linhas = await this.conexao.consultar(
            "UPDATE usuarios SET status = $2, ativo = false WHERE codigo = $1 RETURNING codigo",
            [codigo, StatusPessoa.INATIVO],
        );
        if (linhas.length === 0) throw new ErroNaoEncontrado("Usuário não encontrado.");
    }

    private async gravarHabilidades(conexao: ConexaoBanco, usuario: Usuario): Promise<void> {
        if (usuario.habilidades.length === 0) return;
        await conexao.consultar(
            `INSERT INTO usuario_habilidades (usuario_codigo, habilidade_codigo)
             SELECT $1::uuid, unnest($2::uuid[])
             ON CONFLICT DO NOTHING`,
            [usuario.codigo, usuario.habilidades.map((h) => h.codigo)],
        );
    }
}
