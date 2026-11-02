import Area from "../../domain/Entity/Area";
import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import { ErroNaoEncontrado } from "../../shared/erros/ErroNaoEncontrado";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/** ADR-007: cria ou edita uma área. Impede ciclos na hierarquia. */
export default class SalvarArea {
    constructor(private readonly factory: RepositoryFactoryInterface) {}

    async execute(input: { codigo?: string; nome: string; codigoAreaPai?: string | null; ativa?: boolean }): Promise<Area> {
        const repo = this.factory.criarAreaRepository();
        const atual = input.codigo ? await repo.buscarPorCodigo(input.codigo) : null;
        if (input.codigo && !atual) throw new ErroNaoEncontrado("Área não encontrada.");

        const codigoAreaPai = input.codigoAreaPai || null;
        if (codigoAreaPai) {
            const todas = await repo.listar();
            if (!todas.some((a) => a.codigo === codigoAreaPai)) throw new ErroNaoEncontrado("Área superior não encontrada.");
            // Sobe a partir da área superior; se chegar nesta área, haveria um ciclo.
            let cursor: string | null = codigoAreaPai;
            const visitados = new Set<string>();
            while (cursor && !visitados.has(cursor)) {
                if (atual && cursor === atual.codigo) {
                    throw new ErroValidacao("Uma área não pode ficar abaixo de si mesma.", "AREA_CICLICA");
                }
                visitados.add(cursor);
                cursor = todas.find((a) => a.codigo === cursor)?.codigoAreaPai ?? null;
            }
        }

        const area = new Area(input.nome, codigoAreaPai, input.ativa ?? atual?.ativa ?? true, atual?.codigo);
        return atual ? repo.editar(area) : repo.criar(area);
    }
}
