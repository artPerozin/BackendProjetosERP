import Projeto from "../../../domain/Entity/Projeto";
import ProjetoRepositoryInterface, { FiltroProjetos } from "../../../domain/Interfaces/ProjetoRepositoryInterface";
import { normalizarBusca } from "../../../shared/texto";

export default class ProjetoRepositoryMemory implements ProjetoRepositoryInterface {
    private projetos: Projeto[];

    constructor() {
        this.projetos = [];
    }

    async criar(projeto: Projeto): Promise<Projeto> {
        this.projetos.push(projeto);
        return projeto;
    }

    async listar(filtro: FiltroProjetos = {}): Promise<Projeto[]> {
        const busca = normalizarBusca(filtro.busca);
        return this.projetos
            .filter((p) => !filtro.status?.length || filtro.status.includes(p.status))
            .filter((p) => !filtro.codigoArea || p.area?.codigo === filtro.codigoArea)
            .filter((p) => !filtro.codigoResponsavel || p.responsavel?.codigo === filtro.codigoResponsavel)
            .filter((p) => !busca || normalizarBusca(`${p.nome} ${p.referencia ?? ""} ${p.clienteNome ?? ""}`).includes(busca));
    }

    async listarPorMembro(codigoUsuario: string): Promise<Projeto[]> {
        return this.projetos.filter((p) =>
            p.participacoes.some((m) => m.usuario.codigo === codigoUsuario),
        );
    }

    async buscarPorCodigo(codigo: string): Promise<Projeto | null> {
        return this.projetos.find((p) => p.codigo === codigo) ?? null;
    }

    async editar(projeto: Projeto): Promise<Projeto> {
        const indice = this.projetos.findIndex((p) => p.codigo === projeto.codigo);

        if (indice === -1) {
            throw new Error("Projeto não encontrado");
        }

        this.projetos[indice] = projeto;
        return projeto;
    }

    async excluir(codigo: string): Promise<void> {
        const indice = this.projetos.findIndex((p) => p.codigo === codigo);

        if (indice === -1) {
            throw new Error("Projeto não encontrado");
        }

        this.projetos.splice(indice, 1);
    }
}
