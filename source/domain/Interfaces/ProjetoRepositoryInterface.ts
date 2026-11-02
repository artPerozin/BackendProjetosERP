import Projeto from "../Entity/Projeto";
import StatusProjeto from "../Enum/StatusProjeto";

/** Filtros da lista de projetos. */
export interface FiltroProjetos {
    status?: StatusProjeto[];
    codigoArea?: string;
    codigoResponsavel?: string;
    busca?: string;
}

export default interface ProjetoRepositoryInterface {
    criar(projeto: Projeto): Promise<Projeto>;
    listar(filtro?: FiltroProjetos): Promise<Projeto[]>;
    /** Projetos em que a pessoa participa ou já participou. */
    listarPorMembro(codigoUsuario: string): Promise<Projeto[]>;
    buscarPorCodigo(codigo: string): Promise<Projeto | null>;
    /** Grava o projeto e suas participações. Participações nunca são apagadas, só encerradas. */
    editar(projeto: Projeto): Promise<Projeto>;
    excluir(codigo: string): Promise<void>;
}
