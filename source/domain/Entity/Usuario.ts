import { v4 as uuid } from "uuid";
import PerfilUsuario from "../Enum/PerfilUsuario";
import StatusPessoa, { STATUS_COM_ACESSO, STATUS_NA_EJ } from "../Enum/StatusPessoa";
import { ErroValidacao } from "../../shared/erros/ErroValidacao";
import { MENSAGENS_DE_ERRO } from "../../shared/erros/mensagensDeErro";
import SenioridadeUsuario from "./SenioridadeUsuario";
import Area from "./Area";
import Cargo from "./Cargo";
import Habilidade from "./Habilidade";

/** Campos do perfil da pessoa além dos dados de acesso (RF-010). */
export interface DetalhesPessoa {
    status?: StatusPessoa;
    nomeExibicao?: string | null;
    avatarUrl?: string | null;
    telefone?: string | null;
    linkedinUrl?: string | null;
    curso?: string | null;
    semestre?: number | null;
    area?: Area | null;
    cargo?: Cargo | null;
    dataEntrada?: Date | null;
    dataSaida?: Date | null;
    bio?: string | null;
    habilidades?: Habilidade[];
}

const URL_VALIDA = /^https?:\/\/\S+$/i;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pessoa da Konvex e, ao mesmo tempo, usuário do sistema. Nunca é excluída (ADR-006):
 * a saída muda o status para Alumni ou Inativo.
 */
export default class Usuario {
    readonly codigo: string;
    readonly nome: string;
    readonly email: string;
    readonly perfil: PerfilUsuario;
    readonly senioridade: SenioridadeUsuario | null;
    /** Derivado do status: pode entrar no sistema (ver STATUS_COM_ACESSO). */
    readonly ativo: boolean;
    /** Derivado do status: está na EJ (Ativo ou Trainee), com ou sem acesso. */
    readonly naEj: boolean;
    readonly senha: string;
    readonly status: StatusPessoa;
    readonly nomeExibicao: string | null;
    readonly avatarUrl: string | null;
    readonly telefone: string | null;
    readonly linkedinUrl: string | null;
    readonly curso: string | null;
    readonly semestre: number | null;
    readonly area: Area | null;
    readonly cargo: Cargo | null;
    readonly dataEntrada: Date | null;
    readonly dataSaida: Date | null;
    readonly bio: string | null;
    readonly habilidades: Habilidade[];

    constructor(
        nome: string,
        email: string,
        perfil: PerfilUsuario,
        ativo: boolean,
        senha: string,
        senioridade: SenioridadeUsuario | null = null,
        codigo?: string,
        detalhes: DetalhesPessoa = {},
    ) {
        this.codigo = codigo ?? uuid();
        this.nome = nome;
        this.email = email;
        this.perfil = perfil;
        this.senha = senha;
        this.senioridade = senioridade;
        this.status = detalhes.status ?? (ativo ? StatusPessoa.ATIVO : StatusPessoa.INATIVO);
        this.ativo = STATUS_COM_ACESSO.includes(this.status);
        this.naEj = STATUS_NA_EJ.includes(this.status);
        this.nomeExibicao = textoOuNulo(detalhes.nomeExibicao);
        this.avatarUrl = textoOuNulo(detalhes.avatarUrl);
        this.telefone = textoOuNulo(detalhes.telefone);
        this.linkedinUrl = textoOuNulo(detalhes.linkedinUrl);
        this.curso = textoOuNulo(detalhes.curso);
        this.semestre = detalhes.semestre === undefined || detalhes.semestre === null || (detalhes.semestre as any) === ""
            ? null
            : Number(detalhes.semestre);
        this.area = detalhes.area ?? null;
        this.cargo = detalhes.cargo ?? null;
        this.dataEntrada = detalhes.dataEntrada ?? null;
        this.dataSaida = detalhes.dataSaida ?? null;
        this.bio = textoOuNulo(detalhes.bio);
        this.habilidades = detalhes.habilidades ?? [];

        this.validar();
    }

    /** Cria uma cópia com alterações, preservando o que não foi informado. */
    copiar(alteracoes: Partial<{
        nome: string;
        email: string;
        perfil: PerfilUsuario;
        senha: string;
        senioridade: SenioridadeUsuario | null;
    }> & DetalhesPessoa = {}): Usuario {
        // undefined = "não alterar"; null = "limpar o campo".
        const pick = <K extends keyof Usuario>(chave: K): any =>
            (alteracoes as any)[chave] !== undefined ? (alteracoes as any)[chave] : this[chave];
        return new Usuario(
            pick("nome"),
            pick("email"),
            pick("perfil"),
            this.ativo,
            pick("senha"),
            pick("senioridade"),
            this.codigo,
            {
                status: pick("status"),
                nomeExibicao: pick("nomeExibicao"),
                avatarUrl: pick("avatarUrl"),
                telefone: pick("telefone"),
                linkedinUrl: pick("linkedinUrl"),
                curso: pick("curso"),
                semestre: pick("semestre"),
                area: pick("area"),
                cargo: pick("cargo"),
                dataEntrada: pick("dataEntrada"),
                dataSaida: pick("dataSaida"),
                bio: pick("bio"),
                habilidades: pick("habilidades"),
            },
        );
    }

    toJSON() {
        return {
            codigo: this.codigo,
            nome: this.nome,
            email: this.email,
            perfil: this.perfil,
            senioridade: this.senioridade,
            ativo: this.ativo,
            naEj: this.naEj,
            status: this.status,
            nomeExibicao: this.nomeExibicao,
            avatarUrl: this.avatarUrl,
            telefone: this.telefone,
            linkedinUrl: this.linkedinUrl,
            curso: this.curso,
            semestre: this.semestre,
            area: this.area,
            cargo: this.cargo,
            dataEntrada: this.dataEntrada,
            dataSaida: this.dataSaida,
            bio: this.bio,
            habilidades: this.habilidades,
        };
    }

    private validar(): void {
        if (!this.nome || !this.nome.trim()) {
            throw new ErroValidacao(MENSAGENS_DE_ERRO.VALIDACAO.NOME_OBRIGATORIO, "NOME_OBRIGATORIO");
        }

        if (!this.email || !this.email.trim()) {
            throw new ErroValidacao(MENSAGENS_DE_ERRO.VALIDACAO.EMAIL_OBRIGATORIO, "EMAIL_OBRIGATORIO");
        }

        if (!EMAIL_VALIDO.test(this.email.trim())) {
            throw new ErroValidacao(MENSAGENS_DE_ERRO.VALIDACAO.EMAIL_INVALIDO, "EMAIL_INVALIDO");
        }

        if (!Object.values(PerfilUsuario).includes(this.perfil)) {
            throw new ErroValidacao("Perfil de acesso inválido.", "PERFIL_INVALIDO");
        }

        if (!Object.values(StatusPessoa).includes(this.status)) {
            throw new ErroValidacao("Status de pessoa inválido.", "STATUS_PESSOA_INVALIDO");
        }

        if (this.perfil === PerfilUsuario.MEMBRO && !this.senioridade) {
            throw new ErroValidacao(MENSAGENS_DE_ERRO.VALIDACAO.SENIORIDADE_OBRIGATORIA, "SENIORIDADE_OBRIGATORIA");
        }

        if (this.semestre !== null && (!Number.isInteger(this.semestre) || this.semestre < 1 || this.semestre > 20)) {
            throw new ErroValidacao("O semestre deve ser um número entre 1 e 20.", "SEMESTRE_INVALIDO");
        }

        for (const [campo, valor] of [["avatar", this.avatarUrl], ["LinkedIn", this.linkedinUrl]] as const) {
            if (valor && !URL_VALIDA.test(valor)) {
                throw new ErroValidacao(`O endereço do ${campo} deve começar com http:// ou https://.`, "URL_INVALIDA");
            }
        }

        for (const data of [this.dataEntrada, this.dataSaida]) {
            if (data && Number.isNaN(data.getTime())) {
                throw new ErroValidacao("Datas de entrada e saída devem ser válidas.", "DATA_PESSOA_INVALIDA");
            }
        }

        if (this.dataEntrada && this.dataSaida && this.dataSaida.getTime() < this.dataEntrada.getTime()) {
            throw new ErroValidacao("A data de saída não pode ser anterior à de entrada.", "PERIODO_PESSOA_INVALIDO");
        }
    }
}

function textoOuNulo(valor: string | null | undefined): string | null {
    if (valor === undefined || valor === null) return null;
    const texto = String(valor).trim();
    return texto ? texto : null;
}
