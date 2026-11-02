import PerfilUsuario from "../../domain/Enum/PerfilUsuario";
import StatusPessoa from "../../domain/Enum/StatusPessoa";
import SenioridadeUsuario from "../../domain/Entity/SenioridadeUsuario";
import { EntradaPerfilPessoa } from "../Pessoas/dadosPessoa";

export default interface CriarUsuarioInput extends EntradaPerfilPessoa {
    nome: string;
    email: string;
    senha: string;
    perfil: PerfilUsuario;
    senioridade?: SenioridadeUsuario | null;
    /** Mantido por compatibilidade; prefira `status`. */
    ativo?: boolean;
    /** Ativo ou Trainee (padrão: Ativo). */
    status?: StatusPessoa;
    /** Quem está cadastrando, para o histórico de cargo e área. */
    codigoAutor?: string | null;
}
