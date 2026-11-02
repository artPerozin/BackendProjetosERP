import RepositoryFactoryInterface from "../../domain/Interfaces/RepositoryFactoryInterface";
import UsuarioRepositoryInterface from "../../domain/Interfaces/UsuarioRepositoryInterface";
import SenioridadeRepositoryInterface from "../../domain/Interfaces/SenioridadeRepositoryInterface";
import ProjetoRepositoryInterface from "../../domain/Interfaces/ProjetoRepositoryInterface";
import TarefaRepositoryInterface from "../../domain/Interfaces/TarefaRepositoryInterface";
import CapacitacaoRepositoryInterface from "../../domain/Interfaces/CapacitacaoRepositoryInterface";
import CapacitacaoFeedbackRepositoryInterface from "../../domain/Interfaces/CapacitacaoFeedbackRepositoryInterface";
import CheckinRepositoryInterface from "../../domain/Interfaces/CheckinRepositoryInterface";
import PastaRepositoryInterface from "../../domain/Interfaces/PastaRepositoryInterface";
import DocumentoRepositoryInterface from "../../domain/Interfaces/DocumentoRepositoryInterface";
import ConexaoBanco from "../database/ConexaoBanco";
import UsuarioRepositoryDatabase from "./database/UsuarioRepositoryDatabase";
import SenioridadeRepositoryDatabase from "./database/SenioridadeRepositoryDatabase";
import ProjetoRepositoryDatabase from "./database/ProjetoRepositoryDatabase";
import TarefaRepositoryDatabase from "./database/TarefaRepositoryDatabase";
import CapacitacaoRepositoryDatabase from "./database/CapacitacaoRepositoryDatabase";
import CapacitacaoFeedbackRepositoryDatabase from "./database/CapacitacaoFeedbackRepositoryDatabase";
import CheckinRepositoryDatabase from "./database/CheckinRepositoryDatabase";
import PastaRepositoryDatabase from "./database/PastaRepositoryDatabase";
import DocumentoRepositoryDatabase from "./database/DocumentoRepositoryDatabase";
import AreaRepositoryDatabase from "./database/AreaRepositoryDatabase";
import CargoRepositoryDatabase from "./database/CargoRepositoryDatabase";
import HabilidadeRepositoryDatabase from "./database/HabilidadeRepositoryDatabase";
import HistoricoPessoaRepositoryDatabase from "./database/HistoricoPessoaRepositoryDatabase";
import RefreshTokenRepositoryDatabase from "./database/RefreshTokenRepositoryDatabase";

export default class DatabaseRepositoryFactory implements RepositoryFactoryInterface {
    private readonly conexao: ConexaoBanco;

    constructor(conexao: ConexaoBanco) {
        this.conexao = conexao;
    }

    criarUsuarioRepository(): UsuarioRepositoryInterface {
        return new UsuarioRepositoryDatabase(this.conexao);
    }

    criarSenioridadeRepository(): SenioridadeRepositoryInterface {
        return new SenioridadeRepositoryDatabase(this.conexao);
    }

    criarProjetoRepository(): ProjetoRepositoryInterface {
        return new ProjetoRepositoryDatabase(this.conexao);
    }

    criarTarefaRepository(): TarefaRepositoryInterface {
        return new TarefaRepositoryDatabase(this.conexao);
    }

    criarCapacitacaoRepository(): CapacitacaoRepositoryInterface {
        return new CapacitacaoRepositoryDatabase(this.conexao);
    }

    criarCapacitacaoFeedbackRepository(): CapacitacaoFeedbackRepositoryInterface {
        return new CapacitacaoFeedbackRepositoryDatabase(this.conexao);
    }

    criarCheckinRepository(): CheckinRepositoryInterface {
        return new CheckinRepositoryDatabase(this.conexao);
    }

    criarPastaRepository(): PastaRepositoryInterface {
        return new PastaRepositoryDatabase(this.conexao);
    }

    criarDocumentoRepository(): DocumentoRepositoryInterface {
        return new DocumentoRepositoryDatabase(this.conexao);
    }

    criarAreaRepository() {
        return new AreaRepositoryDatabase(this.conexao);
    }

    criarCargoRepository() {
        return new CargoRepositoryDatabase(this.conexao);
    }

    criarHabilidadeRepository() {
        return new HabilidadeRepositoryDatabase(this.conexao);
    }

    criarHistoricoPessoaRepository() {
        return new HistoricoPessoaRepositoryDatabase(this.conexao);
    }

    criarRefreshTokenRepository() {
        return new RefreshTokenRepositoryDatabase(this.conexao);
    }
}
