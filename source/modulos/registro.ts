import RepositoryFactoryInterface from "../domain/Interfaces/RepositoryFactoryInterface";
import Http from "../infra/http/Http";
import ModelRoutes from "../infra/http/Routes/ModelRoutes";
import UsuarioRoutes from "../infra/http/Routes/UsuarioRoutes";
import ProjetoRoutes from "../infra/http/Routes/ProjetoRoutes";
import TarefaRoutes from "../infra/http/Routes/TarefaRoutes";
import CapacitacaoRoutes from "../infra/http/Routes/CapacitacaoRoutes";
import CheckinRoutes from "../infra/http/Routes/CheckinRoutes";
import PastaRoutes from "../infra/http/Routes/PastaRoutes";
import DocumentoRoutes from "../infra/http/Routes/DocumentoRoutes";
import ConfiguracaoRoutes from "../infra/http/Routes/ConfiguracaoRoutes";
import { Permissao } from "../shared/seguranca/catalogoPermissoes";
import { temPermissao, UsuarioAutenticado } from "../shared/seguranca/permissoes";

/** Item do menu lateral. `chave` e `caminho` são os da tela no frontend; `ordem` define a posição. */
export interface ItemMenu {
    chave: string;
    rotulo: string;
    caminho: string;
    ordem: number;
    /** Sem permissão: visível para qualquer pessoa logada. */
    permissao?: Permissao;
}

type CriarRotas = new (http: Http, factory: RepositoryFactoryInterface) => ModelRoutes;

export interface Modulo {
    chave: string;
    nome: string;
    rotas: CriarRotas[];
    /** Ações do catálogo que pertencem a este módulo. */
    permissoes: Permissao[];
    menu: ItemMenu[];
}

/**
 * Registro único de módulos. Para criar um módulo novo: adicione as ações em
 * catalogoPermissoes.ts e uma entrada aqui; o Router e o menu leem desta lista.
 * As migrações continuam em migrations/ (numeradas, aplicadas em ordem).
 */
export const MODULOS: Modulo[] = [
    {
        chave: "painel",
        nome: "Painel",
        rotas: [],
        permissoes: [Permissao.ESTRATEGIA_VER],
        menu: [
            { chave: "dashboard", rotulo: "Dashboard", caminho: "/", ordem: 10 },
            { chave: "estrategia", rotulo: "Visão Estratégica", caminho: "/estrategia", ordem: 50, permissao: Permissao.ESTRATEGIA_VER },
        ],
    },
    {
        chave: "precificacao",
        nome: "Precificação",
        rotas: [],
        permissoes: [Permissao.PRECIFICACAO_SIMULAR],
        menu: [{ chave: "precificacao", rotulo: "Simular precificação", caminho: "/precificacao", ordem: 70, permissao: Permissao.PRECIFICACAO_SIMULAR }],
    },
    {
        chave: "pessoas",
        nome: "Pessoas",
        rotas: [UsuarioRoutes],
        permissoes: [Permissao.PESSOAS_GERIR, Permissao.PESSOAS_GERIR_DIRETORES],
        menu: [
            { chave: "usuarios", rotulo: "Pessoas", caminho: "/usuarios", ordem: 80, permissao: Permissao.PESSOAS_GERIR },
            // O próprio perfil (dados, projetos, senha) é de todos; o de outra pessoa abre em /perfil/:codigo.
            { chave: "perfil", rotulo: "Meu perfil", caminho: "/perfil", ordem: 95 },
        ],
    },
    {
        chave: "projetos",
        nome: "Projetos",
        rotas: [ProjetoRoutes],
        permissoes: [Permissao.PROJETOS_EDITAR, Permissao.PROJETOS_EXCLUIR],
        menu: [{ chave: "projetos", rotulo: "Projetos", caminho: "/projetos", ordem: 20 }],
    },
    {
        chave: "tarefas",
        nome: "Tarefas",
        rotas: [TarefaRoutes],
        permissoes: [Permissao.TAREFAS_GERIR_TODAS],
        // Tarefas aparecem dentro de cada projeto; sem item próprio no menu.
        menu: [],
    },
    {
        chave: "capacitacoes",
        nome: "Capacitações",
        rotas: [CapacitacaoRoutes],
        permissoes: [Permissao.CAPACITACOES_GERIR],
        menu: [{ chave: "capacitacoes", rotulo: "Capacitações", caminho: "/capacitacoes", ordem: 30 }],
    },
    {
        chave: "checkins",
        nome: "Check-ins",
        rotas: [CheckinRoutes],
        permissoes: [Permissao.CHECKINS_VER_TODOS],
        menu: [{ chave: "checkins", rotulo: "Check-in semanal", caminho: "/checkins", ordem: 40 }],
    },
    {
        chave: "documentos",
        nome: "Documentos",
        rotas: [PastaRoutes, DocumentoRoutes],
        permissoes: [Permissao.DOCUMENTOS_GERIR],
        menu: [{ chave: "gestao", rotulo: "Gestão", caminho: "/gestao", ordem: 60 }],
    },
    {
        chave: "config",
        nome: "Configurações",
        rotas: [ConfiguracaoRoutes],
        permissoes: [Permissao.CONFIGURACOES_EDITAR],
        menu: [{ chave: "configuracoes", rotulo: "Configurações", caminho: "/configuracoes", ordem: 90, permissao: Permissao.CONFIGURACOES_EDITAR }],
    },
];

function itensVisiveis(usuario: UsuarioAutenticado, modulo: Modulo): ItemMenu[] {
    return modulo.menu.filter((item) => !item.permissao || temPermissao(usuario, item.permissao));
}

const semPermissao = ({ chave, rotulo, caminho }: ItemMenu) => ({ chave, rotulo, caminho });

/** Módulos com itens de menu que a pessoa pode ver (módulos sem item visível ficam de fora). */
export function menuDoUsuario(usuario: UsuarioAutenticado, modulos: Modulo[] = MODULOS) {
    return modulos
        .map((modulo) => ({ chave: modulo.chave, nome: modulo.nome, itens: itensVisiveis(usuario, modulo).map(semPermissao) }))
        .filter((modulo) => modulo.itens.length > 0);
}

/** Itens visíveis, em lista única e na ordem do menu lateral. */
export function menuOrdenado(usuario: UsuarioAutenticado, modulos: Modulo[] = MODULOS) {
    return modulos
        .flatMap((modulo) => itensVisiveis(usuario, modulo))
        .sort((a, b) => a.ordem - b.ordem)
        .map(semPermissao);
}
