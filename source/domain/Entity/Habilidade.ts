import { v4 as uuid } from "uuid";
import TipoHabilidade from "../Enum/TipoHabilidade";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/** Habilidade ou tecnologia de uma pessoa (RF-010, doc 04 QA-23). */
export default class Habilidade {
    readonly codigo: string;
    readonly nome: string;
    readonly tipo: TipoHabilidade;

    constructor(nome: string, tipo: TipoHabilidade = TipoHabilidade.HABILIDADE, codigo?: string) {
        this.codigo = codigo ?? uuid();
        this.nome = (nome ?? "").trim();
        this.tipo = tipo;
        if (!this.nome) throw new ErroValidacao("O nome da habilidade é obrigatório.", "NOME_HABILIDADE_OBRIGATORIO");
        if (this.nome.length > 60) throw new ErroValidacao("Cada habilidade deve ter até 60 caracteres.", "NOME_HABILIDADE_LONGO");
        if (!Object.values(TipoHabilidade).includes(tipo)) {
            throw new ErroValidacao("Tipo de habilidade inválido.", "TIPO_HABILIDADE_INVALIDO");
        }
    }
}
