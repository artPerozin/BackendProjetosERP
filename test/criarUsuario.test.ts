import RepositoryFactoryInterface from "../source/domain/Interfaces/RepositoryFactoryInterface";
import MemoryRepositoryFactory from "../source/infra/repository/MemoryRepositoryFactory";
import CriarUsuario from "../source/useCases/CriarUsuario/CriarUsuario";
import PerfilUsuario from "../source/domain/Enum/PerfilUsuario";
import SenioridadeUsuario from "../source/domain/Entity/SenioridadeUsuario";
import { ErroValidacao } from "../source/shared/erros/ErroValidacao";
import { MENSAGENS_DE_ERRO } from "../source/shared/erros/mensagensDeErro";

let repositoryFactory: RepositoryFactoryInterface;
let criarUsuario: CriarUsuario;

const senioridadePleno = new SenioridadeUsuario("pleno", "Pleno", 75);

const inputValido = {
  nome: "John",
  email: "john.doe@konvex.com.br",
  senha: "senha123",
  perfil: PerfilUsuario.MEMBRO,
  senioridade: senioridadePleno,
};

beforeEach(() => {
  repositoryFactory = new MemoryRepositoryFactory();
  criarUsuario = new CriarUsuario(repositoryFactory);
});

test("Deve criar um usuário membro", async () => {
  const output = await criarUsuario.execute(inputValido);
  expect(output.codigo).toBeTruthy();
});

test("Deve criar um usuário gerente com senioridade", async () => {
  const output = await criarUsuario.execute({
    ...inputValido,
    perfil: PerfilUsuario.GERENTE,
    senioridade: senioridadePleno,
  });
  expect(output.codigo).toBeTruthy();
});

test("Não deve criar um usuário com senha inferior a seis caracteres", async () => {
  const promessa = criarUsuario.execute({ ...inputValido, senha: "12345" });
  await expect(promessa).rejects.toBeInstanceOf(ErroValidacao);
  await expect(promessa).rejects.toThrow(
    MENSAGENS_DE_ERRO.VALIDACAO.SENHA_CURTA,
  );
});

test("Não deve criar um membro sem senioridade", async () => {
  const promessa = criarUsuario.execute({ ...inputValido, senioridade: null });
  await expect(promessa).rejects.toBeInstanceOf(ErroValidacao);
  await expect(promessa).rejects.toThrow(
    MENSAGENS_DE_ERRO.VALIDACAO.SENIORIDADE_OBRIGATORIA,
  );
});

test("Não deve criar um diretor ou gerente sem senioridade", async () => {
  const promessa = criarUsuario.execute({
    ...inputValido,
    perfil: PerfilUsuario.GERENTE,
    senioridade: null,
  });
  await expect(promessa).rejects.toBeInstanceOf(ErroValidacao);
  await expect(promessa).rejects.toThrow(
    MENSAGENS_DE_ERRO.VALIDACAO.SENIORIDADE_OBRIGATORIA,
  );
});

test("Não deve criar dois usuários com o mesmo e-mail (sem diferenciar maiúsculas)", async () => {
  await criarUsuario.execute(inputValido);
  const promessa = criarUsuario.execute({
    ...inputValido,
    email: "John.Doe@Konvex.com.br",
  });
  await expect(promessa).rejects.toBeInstanceOf(ErroValidacao);
});

test("Deve verificar se há registros no repositório", async () => {
  const usuarioRepository = repositoryFactory.criarUsuarioRepository();
  expect(await usuarioRepository.listar()).toHaveLength(0);

  await criarUsuario.execute(inputValido);

  expect(await usuarioRepository.listar()).toHaveLength(1);
});

test("Não deve gravar a senha em texto puro", async () => {
  await criarUsuario.execute(inputValido);
  const [usuario] = await repositoryFactory.criarUsuarioRepository().listar();
  expect(usuario.senha).not.toBe(inputValido.senha);
});