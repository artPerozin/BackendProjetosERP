import PerfilUsuario from "../../domain/Enum/PerfilUsuario";

/**
 * Catálogo central de ações do sistema. As rotas checam a ação ("projetos.editar"),
 * nunca o papel diretamente; quem pode o quê fica só no mapa PERMISSOES_POR_PAPEL.
 * Correspondência: diretor = ADMIN, gerente = MANAGER, membro = MEMBER.
 * Ações que todo usuário autenticado pode fazer não entram no catálogo.
 */
export const Permissao = {
    PESSOAS_GERIR: "pessoas.gerir",
    PESSOAS_GERIR_DIRETORES: "pessoas.gerirDiretores",
    PROJETOS_EDITAR: "projetos.editar",
    PROJETOS_EXCLUIR: "projetos.excluir",
    TAREFAS_GERIR_TODAS: "tarefas.gerirTodas",
    CAPACITACOES_GERIR: "capacitacoes.gerir",
    CHECKINS_VER_TODOS: "checkins.verTodos",
    DOCUMENTOS_GERIR: "documentos.gerir",
    CONFIGURACOES_EDITAR: "configuracoes.editar",
    ESTRATEGIA_VER: "estrategia.ver",
    PRECIFICACAO_SIMULAR: "precificacao.simular",
} as const;

export type Permissao = (typeof Permissao)[keyof typeof Permissao];

export const TODAS_AS_PERMISSOES: Permissao[] = Object.values(Permissao);

const DO_GESTOR: Permissao[] = [
    Permissao.PESSOAS_GERIR,
    Permissao.PROJETOS_EDITAR,
    Permissao.TAREFAS_GERIR_TODAS,
    Permissao.CAPACITACOES_GERIR,
    Permissao.CHECKINS_VER_TODOS,
    Permissao.DOCUMENTOS_GERIR,
    Permissao.ESTRATEGIA_VER,
    Permissao.PRECIFICACAO_SIMULAR,
];

export const PERMISSOES_POR_PAPEL: Record<PerfilUsuario, readonly Permissao[]> = {
    [PerfilUsuario.DIRETOR]: TODAS_AS_PERMISSOES,
    [PerfilUsuario.GERENTE]: DO_GESTOR,
    [PerfilUsuario.MEMBRO]: [],
};

export function permissoesDoPapel(perfil: PerfilUsuario | string | null | undefined): Permissao[] {
    return [...(PERMISSOES_POR_PAPEL[perfil as PerfilUsuario] ?? [])];
}
