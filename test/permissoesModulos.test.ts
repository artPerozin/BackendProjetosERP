import PerfilUsuario from "../source/domain/Enum/PerfilUsuario";
import MemoryRepositoryFactory from "../source/infra/repository/MemoryRepositoryFactory";
import Router from "../source/infra/http/Router";
import { MODULOS, menuDoUsuario, menuOrdenado } from "../source/modulos/registro";
import { Permissao, TODAS_AS_PERMISSOES, permissoesDoPapel } from "../source/shared/seguranca/catalogoPermissoes";
import {
    exigirPermissao,
    exigirPodeGerirPerfil,
    resolverUsuarioAlvo,
    temPermissao,
} from "../source/shared/seguranca/permissoes";
import { ErroProibido } from "../source/shared/erros/ErroProibido";
import { ErroNaoAutorizado } from "../source/shared/erros/ErroNaoAutorizado";
import { criarContexto } from "./fixtures";

const diretor = { codigo: "d", perfil: PerfilUsuario.DIRETOR };
const gerente = { codigo: "g", perfil: PerfilUsuario.GERENTE };
const membro = { codigo: "m", perfil: PerfilUsuario.MEMBRO };

describe("Catálogo de permissões", () => {
    test("diretor tem todas; gerente não exclui projeto nem configura; membro nenhuma", () => {
        expect(permissoesDoPapel(PerfilUsuario.DIRETOR).sort()).toEqual([...TODAS_AS_PERMISSOES].sort());
        expect(temPermissao(gerente, Permissao.PROJETOS_EDITAR)).toBe(true);
        expect(temPermissao(gerente, Permissao.PROJETOS_EXCLUIR)).toBe(false);
        expect(temPermissao(gerente, Permissao.CONFIGURACOES_EDITAR)).toBe(false);
        expect(permissoesDoPapel(PerfilUsuario.MEMBRO)).toEqual([]);
        expect(permissoesDoPapel("desconhecido")).toEqual([]);
    });

    test("exigirPermissao recusa sem login e sem permissão", () => {
        expect(() => exigirPermissao(null, Permissao.PROJETOS_EDITAR)).toThrow(ErroNaoAutorizado);
        expect(() => exigirPermissao(membro, Permissao.PROJETOS_EDITAR)).toThrow(ErroProibido);
        expect(exigirPermissao(gerente, Permissao.PROJETOS_EDITAR)).toBe(gerente);
    });

    test("só quem gere diretores mexe em diretor", () => {
        expect(() => exigirPodeGerirPerfil(gerente, null, PerfilUsuario.DIRETOR)).toThrow(ErroProibido);
        expect(() => exigirPodeGerirPerfil(gerente, PerfilUsuario.DIRETOR, PerfilUsuario.MEMBRO)).toThrow(ErroProibido);
        expect(exigirPodeGerirPerfil(gerente, PerfilUsuario.MEMBRO, PerfilUsuario.GERENTE)).toBe(gerente);
        expect(exigirPodeGerirPerfil(diretor, null, PerfilUsuario.DIRETOR)).toBe(diretor);
        expect(() => exigirPodeGerirPerfil(membro, null, PerfilUsuario.MEMBRO)).toThrow(ErroProibido);
    });

    test("membro só age por si; gestor pode indicar outra pessoa", () => {
        expect(resolverUsuarioAlvo(membro, null, Permissao.CAPACITACOES_GERIR)).toBe("m");
        expect(() => resolverUsuarioAlvo(membro, "x", Permissao.CAPACITACOES_GERIR)).toThrow(ErroProibido);
        expect(resolverUsuarioAlvo(gerente, "x", Permissao.CAPACITACOES_GERIR)).toBe("x");
    });
});

describe("Registro de módulos", () => {
    test("cada ação do catálogo pertence a exatamente um módulo", () => {
        const declaradas = MODULOS.flatMap((m) => m.permissoes);
        expect([...declaradas].sort()).toEqual([...TODAS_AS_PERMISSOES].sort());
        expect(new Set(MODULOS.map((m) => m.chave)).size).toBe(MODULOS.length);
    });

    test("menu esconde itens sem permissão", () => {
        const chaves = (u: any) => menuDoUsuario(u).map((m) => m.chave);
        const telas = (u: any) => menuOrdenado(u).map((i) => i.chave);
        expect(telas(diretor)).toEqual(["dashboard", "projetos", "capacitacoes", "checkins", "estrategia", "gestao", "precificacao", "usuarios", "configuracoes", "perfil"]);
        expect(telas(gerente)).toEqual(telas(diretor).filter((t) => t !== "configuracoes"));
        expect(telas(membro)).toEqual(["dashboard", "projetos", "capacitacoes", "checkins", "gestao", "perfil"]);
        // Do módulo Pessoas, o membro só vê o próprio perfil.
        expect(menuDoUsuario(membro).find((m) => m.chave === "pessoas")?.itens.map((i) => i.chave)).toEqual(["perfil"]);
        expect(chaves(membro)).not.toContain("config");
        expect(new Set(MODULOS.flatMap((m) => m.menu.map((i) => i.chave))).size).toBe(MODULOS.flatMap((m) => m.menu).length);
    });

    test("Router registra as rotas de todos os módulos e expõe /auth/permissoes", async () => {
        const rotas: Record<string, any> = {};
        const http: any = {
            route: (metodo: string, url: string, _auth: boolean, cb: any) => { rotas[`${metodo} ${url}`] = cb; },
            uploadRoute: () => undefined,
            downloadRoute: () => undefined,
            swagger: () => undefined,
        };
        new Router(http, new MemoryRepositoryFactory()).init();

        for (const rota of ["get /usuarios", "get /projetos", "get /tarefas", "get /capacitacoes", "get /checkins", "get /pastas", "get /areas"]) {
            expect(rotas[rota]).toBeDefined();
        }
        const resposta = await rotas["get /auth/permissoes"]({}, { user: gerente });
        expect(resposta.permissoes).toContain(Permissao.PROJETOS_EDITAR);
        expect(resposta.menu.map((i: any) => i.chave)).toContain("usuarios");
        const deMembro = await rotas["get /auth/permissoes"]({}, { user: membro });
        expect(deMembro.menu.map((i: any) => i.chave)).not.toContain("usuarios");
        await expect(rotas["get /auth/permissoes"]({}, {})).rejects.toThrow(ErroNaoAutorizado);
    });
});

describe("PUT /auth/perfil", () => {
    test("a pessoa edita só os próprios dados de contato", async () => {
        const { factory, membro: ana } = await criarContexto();
        const rotas: Record<string, any> = {};
        const http: any = {
            route: (metodo: string, url: string, _auth: boolean, cb: any) => { rotas[`${metodo} ${url}`] = cb; },
            uploadRoute: () => undefined, downloadRoute: () => undefined, swagger: () => undefined,
        };
        new Router(http, factory).init();
        const eu = { codigo: ana.codigo, perfil: ana.perfil };

        const editado = await rotas["put /auth/perfil"]({}, {
            user: eu, telefone: "47 99999-0000", bio: "Oi", curso: "Eng. de Software",
            // Ignorados: só a gestão muda nome, e-mail, perfil e área.
            nome: "Outro", email: "x@y.com", perfil: PerfilUsuario.DIRETOR, codigoArea: "qualquer",
        });
        expect(editado.telefone).toBe("47 99999-0000");
        expect(editado.bio).toBe("Oi");
        expect(editado.nome).toBe(ana.nome);
        expect(editado.email).toBe(ana.email);
        expect(editado.perfil).toBe(ana.perfil);
        await expect(rotas["put /auth/perfil"]({}, { telefone: "1" })).rejects.toThrow(ErroNaoAutorizado);
    });
});
