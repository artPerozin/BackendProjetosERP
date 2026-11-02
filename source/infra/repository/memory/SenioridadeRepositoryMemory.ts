import SenioridadeUsuario from "../../../domain/Entity/SenioridadeUsuario";
import SenioridadeRepositoryInterface from "../../../domain/Interfaces/SenioridadeRepositoryInterface";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

export default class SenioridadeRepositoryMemory implements SenioridadeRepositoryInterface {
    private senioridades: SenioridadeUsuario[];

    constructor(
        senioridades: SenioridadeUsuario[] = [
            new SenioridadeUsuario("trainee", "Trainee", 0, 1),
            new SenioridadeUsuario("junior", "Júnior", 45, 2),
            new SenioridadeUsuario("pleno", "Pleno", 75, 3),
            new SenioridadeUsuario("senior", "Sênior", 120, 4),
            new SenioridadeUsuario("lideranca", "Liderança", 0, 5),
        ],
    ) {
        this.senioridades = senioridades;
    }

    async listar(): Promise<SenioridadeUsuario[]> {
        return [...this.senioridades].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
    }

    async criar(senioridade: SenioridadeUsuario): Promise<SenioridadeUsuario> {
        if (this.senioridades.some((s) => s.codigo === senioridade.codigo)) {
            throw new ErroConflito("Já existe uma senioridade com esse código.", "SENIORIDADE_DUPLICADA");
        }
        this.senioridades.push(senioridade);
        return senioridade;
    }

    async editar(senioridade: SenioridadeUsuario): Promise<SenioridadeUsuario> {
        const indice = this.senioridades.findIndex((s) => s.codigo === senioridade.codigo);
        if (indice === -1) throw new ErroNaoEncontrado("Senioridade não encontrada.");
        const atual = this.senioridades[indice];
        // O valor-hora não muda por aqui (fase 3).
        this.senioridades[indice] = new SenioridadeUsuario(atual.codigo, senioridade.nome, atual.valorHora, senioridade.ordem);
        return this.senioridades[indice];
    }

    async buscarPorCodigo(codigo: string): Promise<SenioridadeUsuario | null> {
        return this.senioridades.find((s) => s.codigo === codigo) ?? null;
    }
}
