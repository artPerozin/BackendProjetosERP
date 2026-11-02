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
import UsuarioRepositoryMemory from "./memory/UsuarioRepositoryMemory";
import SenioridadeRepositoryMemory from "./memory/SenioridadeRepositoryMemory";
import ProjetoRepositoryMemory from "./memory/ProjetoRepositoryMemory";
import TarefaRepositoryMemory from "./memory/TarefaRepositoryMemory";
import CapacitacaoRepositoryMemory from "./memory/CapacitacaoRepositoryMemory";
import CapacitacaoFeedbackRepositoryMemory from "./memory/CapacitacaoFeedbackRepositoryMemory";
import CheckinRepositoryMemory from "./memory/CheckinRepositoryMemory";
import PastaRepositoryMemory from "./memory/PastaRepositoryMemory";
import DocumentoRepositoryMemory from "./memory/DocumentoRepositoryMemory";
import AreaRepositoryMemory from "./memory/AreaRepositoryMemory";
import CargoRepositoryMemory from "./memory/CargoRepositoryMemory";
import HabilidadeRepositoryMemory from "./memory/HabilidadeRepositoryMemory";
import HistoricoPessoaRepositoryMemory from "./memory/HistoricoPessoaRepositoryMemory";
import RefreshTokenRepositoryMemory from "./memory/RefreshTokenRepositoryMemory";

export default class MemoryRepositoryFactory implements RepositoryFactoryInterface {
    private readonly usuarioRepository: UsuarioRepositoryInterface;
    private readonly senioridadeRepository: SenioridadeRepositoryInterface;
    private readonly projetoRepository: ProjetoRepositoryInterface;
    private readonly tarefaRepository: TarefaRepositoryInterface;
    private readonly capacitacaoRepository: CapacitacaoRepositoryInterface;
    private readonly capacitacaoFeedbackRepository: CapacitacaoFeedbackRepositoryInterface;
    private readonly checkinRepository: CheckinRepositoryInterface;
    private readonly pastaRepository: PastaRepositoryInterface;
    private readonly documentoRepository: DocumentoRepositoryInterface;

    constructor() {
        this.usuarioRepository = new UsuarioRepositoryMemory();
        this.senioridadeRepository = new SenioridadeRepositoryMemory();
        this.projetoRepository = new ProjetoRepositoryMemory();
        this.tarefaRepository = new TarefaRepositoryMemory();
        this.capacitacaoRepository = new CapacitacaoRepositoryMemory();
        this.capacitacaoFeedbackRepository = new CapacitacaoFeedbackRepositoryMemory();
        this.checkinRepository = new CheckinRepositoryMemory();
        this.pastaRepository = new PastaRepositoryMemory();
        this.documentoRepository = new DocumentoRepositoryMemory();
    }

    criarUsuarioRepository(): UsuarioRepositoryInterface {
        return this.usuarioRepository;
    }

    criarSenioridadeRepository(): SenioridadeRepositoryInterface {
        return this.senioridadeRepository;
    }

    criarProjetoRepository(): ProjetoRepositoryInterface {
        return this.projetoRepository;
    }

    criarTarefaRepository(): TarefaRepositoryInterface {
        return this.tarefaRepository;
    }

    criarCapacitacaoRepository(): CapacitacaoRepositoryInterface {
        return this.capacitacaoRepository;
    }

    criarCapacitacaoFeedbackRepository(): CapacitacaoFeedbackRepositoryInterface {
        return this.capacitacaoFeedbackRepository;
    }

    criarCheckinRepository(): CheckinRepositoryInterface {
        return this.checkinRepository;
    }

    criarPastaRepository(): PastaRepositoryInterface {
        return this.pastaRepository;
    }

    criarDocumentoRepository(): DocumentoRepositoryInterface {
        return this.documentoRepository;
    }

    private readonly areaRepository = new AreaRepositoryMemory();
    private readonly cargoRepository = new CargoRepositoryMemory();
    private readonly habilidadeRepository = new HabilidadeRepositoryMemory();
    private readonly historicoPessoaRepository = new HistoricoPessoaRepositoryMemory();
    private readonly refreshTokenRepository = new RefreshTokenRepositoryMemory();

    criarAreaRepository() {
        return this.areaRepository;
    }

    criarCargoRepository() {
        return this.cargoRepository;
    }

    criarHabilidadeRepository() {
        return this.habilidadeRepository;
    }

    criarHistoricoPessoaRepository() {
        return this.historicoPessoaRepository;
    }

    criarRefreshTokenRepository() {
        return this.refreshTokenRepository;
    }
}
