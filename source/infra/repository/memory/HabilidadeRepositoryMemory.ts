import Habilidade from "../../../domain/Entity/Habilidade";
import TipoHabilidade from "../../../domain/Enum/TipoHabilidade";
import HabilidadeRepositoryInterface from "../../../domain/Interfaces/HabilidadeRepositoryInterface";

export default class HabilidadeRepositoryMemory implements HabilidadeRepositoryInterface {
    private habilidades: Habilidade[] = [];

    async listar(): Promise<Habilidade[]> {
        return [...this.habilidades].sort((a, b) => a.nome.localeCompare(b.nome));
    }

    async garantir(nome: string, tipo: TipoHabilidade): Promise<Habilidade> {
        const nova = new Habilidade(nome, tipo);
        const existente = this.habilidades.find(
            (h) => h.tipo === tipo && h.nome.toLowerCase() === nova.nome.toLowerCase(),
        );
        if (existente) return existente;
        this.habilidades.push(nova);
        return nova;
    }
}
