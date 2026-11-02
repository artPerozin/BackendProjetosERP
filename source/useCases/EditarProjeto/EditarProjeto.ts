import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Projeto from "../../domain/Entity/Projeto";
import Participacao, { hoje } from "../../domain/Entity/Participacao";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { resolverDetalhesProjeto } from "../Projetos/dadosProjeto";
import EditarProjetoInput from "./EditarProjetoInput";

/** RF-020 e RF-022: edita o projeto. Ninguém sai do histórico da equipe. */
export default class EditarProjeto {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: EditarProjetoInput): Promise<Projeto> {
        const projetos = this.factory.criarProjetoRepository();
        const atual = await projetos.buscarPorCodigo(input.codigo);
        if (!atual) throw new ErroNaoEncontrado("Projeto não encontrado.");

        let participacoes = atual.participacoes;
        if (input.codigosMembros !== undefined) {
            const desejados = new Set(input.codigosMembros);
            const data = hoje();
            participacoes = participacoes.map((p) =>
                p.ativa && !desejados.has(p.usuario.codigo)
                    ? p.copiar({ dataSaida: data < p.dataEntrada ? p.dataEntrada : data })
                    : p,
            );
            const usuarios = this.factory.criarUsuarioRepository();
            for (const codigo of desejados) {
                if (atual.participacaoAtivaDe(codigo)) continue;
                const usuario = await usuarios.buscarPorCodigo(codigo);
                if (!usuario || !usuario.naEj) throw new ErroNaoEncontrado(`Pessoa da EJ não encontrada: ${codigo}`);
                participacoes = [...participacoes, new Participacao(usuario, { dataEntrada: data })];
            }
        }

        const detalhes = await resolverDetalhesProjeto(this.factory, input);
        const editado = atual.copiar({
            nome: String(input.nome ?? atual.nome).trim(),
            descricao: String(input.descricao ?? atual.descricao).trim(),
            dataInicio: input.dataInicio ?? atual.dataInicio,
            dataFim: input.dataFim ?? atual.dataFim,
            status: input.status,
            participacoes,
            ...detalhes,
        });
        return projetos.editar(editado);
    }
}
