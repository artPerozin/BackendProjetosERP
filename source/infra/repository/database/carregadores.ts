import ConexaoBanco from "../../database/ConexaoBanco";
import Usuario from "../../../domain/Entity/Usuario";
import SenioridadeUsuario from "../../../domain/Entity/SenioridadeUsuario";
import Projeto from "../../../domain/Entity/Projeto";
import Capacitacao from "../../../domain/Entity/Capacitacao";
import PerfilUsuario from "../../../domain/Enum/PerfilUsuario";
import StatusProjeto from "../../../domain/Enum/StatusProjeto";
import TipoCapacitacao from "../../../domain/Enum/TipoCapacitacao";
import StatusPessoa from "../../../domain/Enum/StatusPessoa";
import PrioridadeProjeto from "../../../domain/Enum/PrioridadeProjeto";
import TipoHabilidade from "../../../domain/Enum/TipoHabilidade";
import Area from "../../../domain/Entity/Area";
import Cargo from "../../../domain/Entity/Cargo";
import Habilidade from "../../../domain/Entity/Habilidade";
import Participacao from "../../../domain/Entity/Participacao";

export const SELECT_USUARIO = `
    SELECT u.codigo, u.nome, u.email, u.perfil, u.ativo, u.senha_hash, u.status,
           u.nome_exibicao, u.avatar_url, u.telefone, u.linkedin_url, u.curso, u.semestre,
           u.data_entrada, u.data_saida, u.bio,
           s.codigo AS senioridade_codigo,
           s.nome AS senioridade_nome,
           s.valor_hora AS senioridade_valor_hora,
           s.ordem AS senioridade_ordem,
           a.codigo AS area_codigo, a.nome AS area_nome, a.area_pai_codigo AS area_pai_codigo, a.ativa AS area_ativa,
           c.codigo AS cargo_codigo, c.nome AS cargo_nome, c.ativo AS cargo_ativo,
           COALESCE((
               SELECT json_agg(json_build_object('codigo', h.codigo, 'nome', h.nome, 'tipo', h.tipo) ORDER BY h.tipo, h.nome)
               FROM usuario_habilidades uh
               JOIN habilidades h ON h.codigo = uh.habilidade_codigo
               WHERE uh.usuario_codigo = u.codigo
           ), '[]'::json) AS habilidades
    FROM usuarios u
    LEFT JOIN senioridades s ON s.codigo = u.senioridade_codigo
    LEFT JOIN areas a ON a.codigo = u.area_codigo
    LEFT JOIN cargos c ON c.codigo = u.cargo_codigo
`;

function unicos(codigos: string[]): string[] {
    return [...new Set(codigos)];
}

export function areaDeLinha(linha: any): Area | null {
    if (!linha.area_codigo) return null;
    return new Area(linha.area_nome, linha.area_pai_codigo ?? null, linha.area_ativa ?? true, linha.area_codigo);
}

export function usuarioDeLinha(linha: any): Usuario {
    const senioridade = linha.senioridade_codigo
        ? new SenioridadeUsuario(
            linha.senioridade_codigo,
            linha.senioridade_nome,
            Number(linha.senioridade_valor_hora),
            Number(linha.senioridade_ordem ?? 0),
        )
        : null;

    return new Usuario(
        linha.nome,
        linha.email,
        linha.perfil as PerfilUsuario,
        linha.ativo,
        linha.senha_hash,
        senioridade,
        linha.codigo,
        {
            status: (linha.status as StatusPessoa) ?? undefined,
            nomeExibicao: linha.nome_exibicao,
            avatarUrl: linha.avatar_url,
            telefone: linha.telefone,
            linkedinUrl: linha.linkedin_url,
            curso: linha.curso,
            semestre: linha.semestre,
            area: areaDeLinha(linha),
            cargo: linha.cargo_codigo ? new Cargo(linha.cargo_nome, linha.cargo_ativo, linha.cargo_codigo) : null,
            dataEntrada: linha.data_entrada,
            dataSaida: linha.data_saida,
            bio: linha.bio,
            habilidades: (linha.habilidades ?? []).map(
                (h: any) => new Habilidade(h.nome, h.tipo as TipoHabilidade, h.codigo),
            ),
        },
    );
}

export async function carregarUsuarios(
    conexao: ConexaoBanco,
    codigos: string[],
): Promise<Map<string, Usuario>> {
    const usuarios = new Map<string, Usuario>();
    const lista = unicos(codigos);

    if (lista.length === 0) {
        return usuarios;
    }

    const linhas = await conexao.consultar(
        `${SELECT_USUARIO} WHERE u.codigo = ANY($1::uuid[])`,
        [lista],
    );

    linhas.forEach((linha) => usuarios.set(linha.codigo, usuarioDeLinha(linha)));
    return usuarios;
}

export async function carregarProjetos(
    conexao: ConexaoBanco,
    codigos: string[],
): Promise<Map<string, Projeto>> {
    const projetos = new Map<string, Projeto>();
    const lista = unicos(codigos);

    if (lista.length === 0) {
        return projetos;
    }

    const linhas = await conexao.consultar(
        `SELECT p.codigo, p.nome, p.descricao, p.data_inicio, p.data_fim, p.status,
                p.referencia, p.objetivo, p.cliente_nome, p.prioridade, p.progresso,
                p.responsavel_codigo, p.tags,
                a.codigo AS area_codigo, a.nome AS area_nome, a.area_pai_codigo, a.ativa AS area_ativa
         FROM projetos p
         LEFT JOIN areas a ON a.codigo = p.area_codigo
         WHERE p.codigo = ANY($1::uuid[])`,
        [lista],
    );

    const vinculos = await conexao.consultar(
        `SELECT codigo, projeto_codigo, usuario_codigo, funcao, responsabilidades, alocacao, data_entrada, data_saida
         FROM projeto_membros
         WHERE projeto_codigo = ANY($1::uuid[])
         ORDER BY data_entrada, codigo`,
        [lista],
    );

    const usuarios = await carregarUsuarios(conexao, [
        ...vinculos.map((v) => v.usuario_codigo),
        ...linhas.map((l) => l.responsavel_codigo).filter(Boolean),
    ]);

    for (const linha of linhas) {
        const participacoes = vinculos
            .filter((v) => v.projeto_codigo === linha.codigo)
            .map((v) => new Participacao(
                usuarios.get(v.usuario_codigo)!,
                {
                    funcao: v.funcao,
                    responsabilidades: v.responsabilidades,
                    alocacao: Number(v.alocacao),
                    dataEntrada: v.data_entrada,
                    dataSaida: v.data_saida,
                },
                v.codigo,
            ));

        projetos.set(
            linha.codigo,
            new Projeto(
                linha.nome,
                linha.descricao,
                linha.data_inicio,
                linha.data_fim,
                linha.status as StatusProjeto,
                participacoes,
                linha.codigo,
                {
                    referencia: linha.referencia,
                    objetivo: linha.objetivo,
                    clienteNome: linha.cliente_nome,
                    prioridade: linha.prioridade as PrioridadeProjeto,
                    progresso: Number(linha.progresso),
                    responsavel: linha.responsavel_codigo ? usuarios.get(linha.responsavel_codigo) ?? null : null,
                    area: areaDeLinha(linha),
                    tags: linha.tags ?? [],
                },
            ),
        );
    }

    return projetos;
}

export async function carregarCapacitacoes(
    conexao: ConexaoBanco,
    codigos: string[],
): Promise<Map<string, Capacitacao>> {
    const capacitacoes = new Map<string, Capacitacao>();
    const lista = unicos(codigos);

    if (lista.length === 0) {
        return capacitacoes;
    }

    const linhas = await conexao.consultar(
        `SELECT codigo, titulo, data, to_char(hora, 'HH24:MI') AS hora,
                instrutor_codigo, vagas, tipo, sala
         FROM capacitacoes
         WHERE codigo = ANY($1::uuid[])`,
        [lista],
    );

    const inscricoes = await conexao.consultar(
        `SELECT capacitacao_codigo, usuario_codigo
         FROM capacitacao_inscricoes
         WHERE capacitacao_codigo = ANY($1::uuid[])`,
        [lista],
    );

    const usuarios = await carregarUsuarios(conexao, [
        ...linhas.map((l) => l.instrutor_codigo),
        ...inscricoes.map((i) => i.usuario_codigo),
    ]);

    for (const linha of linhas) {
        const inscritos = inscricoes
            .filter((i) => i.capacitacao_codigo === linha.codigo)
            .map((i) => usuarios.get(i.usuario_codigo)!);

        capacitacoes.set(
            linha.codigo,
            new Capacitacao(
                linha.titulo,
                linha.data,
                linha.hora,
                usuarios.get(linha.instrutor_codigo)!,
                linha.vagas,
                linha.tipo as TipoCapacitacao,
                linha.sala,
                inscritos,
                linha.codigo,
            ),
        );
    }

    return capacitacoes;
}
