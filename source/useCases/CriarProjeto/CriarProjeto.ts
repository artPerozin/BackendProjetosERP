import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Projeto from "../../domain/Entity/Projeto";
import Participacao from "../../domain/Entity/Participacao";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { resolverDetalhesProjeto } from "../Projetos/dadosProjeto";
import CriarProjetoInput from "./CriarProjetoInput";

/** RF-020: cadastra um projeto. */
export default class CriarProjeto {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: CriarProjetoInput): Promise<Projeto> {
        const usuarios = this.factory.criarUsuarioRepository();
        const participacoes: Participacao[] = [];
        for (const codigo of [...new Set(input.codigosMembros ?? [])]) {
            const usuario = await usuarios.buscarPorCodigo(codigo);
            if (!usuario || !usuario.naEj) throw new ErroNaoEncontrado(`Pessoa da EJ não encontrada: ${codigo}`);
            participacoes.push(new Participacao(usuario, { dataEntrada: input.dataInicio }));
        }
        const detalhes = await resolverDetalhesProjeto(this.factory, input);
        const projeto = new Projeto(
            String(input.nome ?? "").trim(),
            String(input.descricao ?? "").trim(),
            input.dataInicio,
            input.dataFim,
            input.status,
            participacoes,
            undefined,
            detalhes,
        );
        return this.factory.criarProjetoRepository().criar(projeto);
    }
}
