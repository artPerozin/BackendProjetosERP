import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import Usuario from "../../domain/Entity/Usuario";
import { hoje } from "../../domain/Entity/Participacao";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroConflito } from "../../shared/erros/ErroConflito";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";
import { MENSAGENS_DE_ERRO } from "../../shared/erros/mensagensDeErro";
import { resolverPerfilPessoa } from "../Pessoas/dadosPessoa";
import EditarUsuarioInput from "./EditarUsuarioInput";

/**
 * RF-010 e RF-014: edita a pessoa. Mudança de cargo ou de área gera um registro
 * no histórico, sem apagar o anterior (RN-02). O status muda em AlterarStatusPessoa.
 */
export default class EditarUsuario {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: EditarUsuarioInput): Promise<Usuario> {
        const usuarios = this.factory.criarUsuarioRepository();
        const atual = await usuarios.buscarPorCodigo(input.codigo);
        if (!atual) throw new ErroNaoEncontrado(MENSAGENS_DE_ERRO.USUARIO.NAO_ENCONTRADO);

        const email = String(input.email ?? atual.email).trim().toLowerCase();
        const porEmail = await usuarios.buscarPorEmail(email);
        if (porEmail && porEmail.codigo !== atual.codigo) {
            throw new ErroConflito(MENSAGENS_DE_ERRO.USUARIO.EMAIL_JA_CADASTRADO, "EMAIL_JA_CADASTRADO");
        }

        let senioridade = atual.senioridade;
        if (input.senioridade?.codigo) {
            senioridade = await this.factory.criarSenioridadeRepository().buscarPorCodigo(input.senioridade.codigo);
            if (!senioridade) throw new ErroNaoEncontrado("Senioridade não encontrada.");
        }
        if (!senioridade) {
            throw new ErroValidacao("Selecione uma senioridade cadastrada para o usuário.", "SENIORIDADE_OBRIGATORIA");
        }

        const detalhes = await resolverPerfilPessoa(this.factory, input);
        const editado = atual.copiar({
            nome: input.nome !== undefined ? String(input.nome).trim() : undefined,
            email,
            perfil: input.perfil ?? atual.perfil,
            senioridade,
            ...detalhes,
        });
        await usuarios.editar(editado);

        const historico = this.factory.criarHistoricoPessoaRepository();
        const dataVigencia = input.dataVigencia ?? hoje();
        if ((atual.cargo?.codigo ?? null) !== (editado.cargo?.codigo ?? null)) {
            await historico.registrarCargo({
                codigoUsuario: editado.codigo, cargoAnterior: atual.cargo, cargoNovo: editado.cargo,
                dataVigencia, codigoRegistradoPor: input.codigoAutor ?? null,
            });
        }
        if ((atual.area?.codigo ?? null) !== (editado.area?.codigo ?? null)) {
            await historico.registrarArea({
                codigoUsuario: editado.codigo, areaAnterior: atual.area, areaNova: editado.area,
                dataVigencia, codigoRegistradoPor: input.codigoAutor ?? null,
            });
        }
        return editado;
    }
}
