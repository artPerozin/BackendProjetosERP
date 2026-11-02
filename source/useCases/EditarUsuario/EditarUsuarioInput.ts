import PerfilUsuario from "../../domain/Enum/PerfilUsuario";
import SenioridadeUsuario from "../../domain/Entity/SenioridadeUsuario";
import { EntradaPerfilPessoa } from "../Pessoas/dadosPessoa";

export default interface EditarUsuarioInput extends EntradaPerfilPessoa {
    codigo: string;
    nome?: string;
    email?: string;
    perfil?: PerfilUsuario;
    senioridade?: SenioridadeUsuario | null;
    /** Data em que a mudança de cargo ou área passa a valer (padrão: hoje). */
    dataVigencia?: Date | null;
    codigoAutor?: string | null;
}
