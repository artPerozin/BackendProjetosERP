import StatusPessoa from "../source/domain/Enum/StatusPessoa";
import AlterarStatusPessoa from "../source/useCases/Pessoas/AlterarStatusPessoa";
import { AdicionarParticipante } from "../source/useCases/Projetos/Equipe";
import ObterPerfilPessoa from "../source/useCases/Pessoas/ObterPerfilPessoa";
import { criarContexto, criarProjeto } from "./fixtures";

describe("Status de pessoa (RF-011, RN-01)", () => {
    it("trainee está na EJ e entra em projetos, mas não tem acesso ao sistema", async () => {
        const { factory, membro, gerente } = await criarContexto();
        const { usuario } = await new AlterarStatusPessoa(factory).execute({ codigo: membro.codigo, status: StatusPessoa.TRAINEE });
        expect(usuario.ativo).toBe(false);
        expect(usuario.naEj).toBe(true);

        const projeto = await criarProjeto(factory, gerente);
        const { projeto: comTrainee } = await new AdicionarParticipante(factory).execute({
            codigoProjeto: projeto.codigo, codigoUsuario: membro.codigo, alocacao: 20,
        });
        expect(comTrainee.membros.map((m) => m.codigo)).toContain(membro.codigo);
    });

    it("a saída encerra as participações, mas o histórico continua no perfil (CT-012)", async () => {
        const { factory, membro } = await criarContexto();
        await criarProjeto(factory, membro);
        const resultado = await new AlterarStatusPessoa(factory).execute({ codigo: membro.codigo, status: StatusPessoa.ALUMNI });
        expect(resultado.participacoesEncerradas).toBe(1);
        expect(resultado.usuario.dataSaida).not.toBeNull();

        const perfil = await new ObterPerfilPessoa(factory).execute(membro.codigo);
        expect(perfil.projetosAtuais).toHaveLength(0);
        expect(perfil.projetosAnteriores).toHaveLength(1);
        expect(await factory.criarUsuarioRepository().buscarPorCodigo(membro.codigo)).not.toBeNull();
    });
});
