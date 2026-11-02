import Area from "../../../domain/Entity/Area";
import AreaRepositoryInterface from "../../../domain/Interfaces/AreaRepositoryInterface";
import { ErroConflito } from "../../../shared/erros/ErroConflito";
import { ErroNaoEncontrado } from "../../../shared/erros/ErroNaoEncontrado";

export default class AreaRepositoryMemory implements AreaRepositoryInterface {
    private areas: Area[] = [];

    async listar(): Promise<Area[]> {
        return [...this.areas].sort((a, b) => a.nome.localeCompare(b.nome));
    }

    async buscarPorCodigo(codigo: string): Promise<Area | null> {
        return this.areas.find((a) => a.codigo === codigo) ?? null;
    }

    async criar(area: Area): Promise<Area> {
        this.garantirNomeLivre(area);
        this.areas.push(area);
        return area;
    }

    async editar(area: Area): Promise<Area> {
        const indice = this.areas.findIndex((a) => a.codigo === area.codigo);
        if (indice === -1) throw new ErroNaoEncontrado("Área não encontrada.");
        this.garantirNomeLivre(area);
        this.areas[indice] = area;
        return area;
    }

    private garantirNomeLivre(area: Area): void {
        if (this.areas.some((a) => a.codigo !== area.codigo && a.nome.toLowerCase() === area.nome.toLowerCase())) {
            throw new ErroConflito("Já existe uma área com esse nome.", "AREA_DUPLICADA");
        }
    }
}
