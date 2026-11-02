import StatusProjeto from "../../domain/Enum/StatusProjeto";
import { EntradaDetalhesProjeto } from "../Projetos/dadosProjeto";

export default interface EditarProjetoInput extends EntradaDetalhesProjeto {
    codigo: string;
    nome: string;
    descricao: string;
    dataInicio: Date;
    dataFim: Date;
    status?: StatusProjeto;
    /**
     * Se informado, a equipe passa a ser exatamente essa lista: quem saiu tem a participação
     * encerrada hoje e quem entrou ganha uma participação nova. Se omitido, a equipe não muda.
     */
    codigosMembros?: string[];
}
