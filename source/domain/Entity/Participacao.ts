import { v4 as uuid } from "uuid";
import Usuario from "./Usuario";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";

/**
 * Passagem de uma pessoa por um projeto (RF-022, RN-03). Ao sair, a participação
 * recebe data de saída e continua no histórico; uma nova entrada cria outra participação.
 */
export default class Participacao {
    readonly codigo: string;
    readonly usuario: Usuario;
    readonly funcao: string | null;
    readonly responsabilidades: string | null;
    /** Percentual de dedicação ao projeto, de 0 a 100. */
    readonly alocacao: number;
    readonly dataEntrada: Date;
    readonly dataSaida: Date | null;

    constructor(
        usuario: Usuario,
        dados: {
            funcao?: string | null;
            responsabilidades?: string | null;
            alocacao?: number;
            dataEntrada?: Date;
            dataSaida?: Date | null;
        } = {},
        codigo?: string,
    ) {
        this.codigo = codigo ?? uuid();
        this.usuario = usuario;
        this.funcao = dados.funcao?.trim() || null;
        this.responsabilidades = dados.responsabilidades?.trim() || null;
        this.alocacao = dados.alocacao === undefined || dados.alocacao === null ? 0 : Number(dados.alocacao);
        this.dataEntrada = dados.dataEntrada ?? hoje();
        this.dataSaida = dados.dataSaida ?? null;
        this.validar();
    }

    get ativa(): boolean {
        return this.dataSaida === null;
    }

    copiar(alteracoes: { funcao?: string | null; responsabilidades?: string | null; alocacao?: number; dataSaida?: Date | null }): Participacao {
        return new Participacao(
            this.usuario,
            {
                funcao: alteracoes.funcao !== undefined ? alteracoes.funcao : this.funcao,
                responsabilidades: alteracoes.responsabilidades !== undefined ? alteracoes.responsabilidades : this.responsabilidades,
                alocacao: alteracoes.alocacao !== undefined ? alteracoes.alocacao : this.alocacao,
                dataEntrada: this.dataEntrada,
                dataSaida: alteracoes.dataSaida !== undefined ? alteracoes.dataSaida : this.dataSaida,
            },
            this.codigo,
        );
    }

    toJSON() {
        return {
            codigo: this.codigo,
            usuario: this.usuario,
            funcao: this.funcao,
            responsabilidades: this.responsabilidades,
            alocacao: this.alocacao,
            dataEntrada: this.dataEntrada,
            dataSaida: this.dataSaida,
            ativa: this.ativa,
        };
    }

    private validar(): void {
        if (!Number.isInteger(this.alocacao) || this.alocacao < 0 || this.alocacao > 100) {
            throw new ErroValidacao("A alocação deve ser um número inteiro entre 0 e 100.", "ALOCACAO_INVALIDA");
        }
        if (this.funcao && this.funcao.length > 80) {
            throw new ErroValidacao("A função no projeto deve ter até 80 caracteres.", "FUNCAO_LONGA");
        }
        if (Number.isNaN(this.dataEntrada.getTime()) || (this.dataSaida && Number.isNaN(this.dataSaida.getTime()))) {
            throw new ErroValidacao("As datas da participação devem ser válidas.", "DATA_PARTICIPACAO_INVALIDA");
        }
        if (this.dataSaida && this.dataSaida.getTime() < this.dataEntrada.getTime()) {
            throw new ErroValidacao("A saída do projeto não pode ser anterior à entrada.", "PERIODO_PARTICIPACAO_INVALIDO");
        }
    }
}

/** Data de hoje à meia-noite UTC, no mesmo formato das datas lidas do banco. */
export function hoje(): Date {
    const agora = new Date();
    return new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()));
}
