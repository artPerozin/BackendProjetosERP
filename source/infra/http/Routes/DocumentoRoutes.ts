import RepositoryFactoryInterface from "../../../domain/Interfaces/RepositoryFactoryInterface";
import Http from "../Http";
import ModelRoutes from "./ModelRoutes";
import ListarDocumentos from "../../../useCases/ListarDocumentos/ListarDocumentos";
import EnviarDocumento from "../../../useCases/EnviarDocumento/EnviarDocumento";
import RenomearDocumento from "../../../useCases/RenomearDocumento/RenomearDocumento";
import ExcluirDocumento from "../../../useCases/ExcluirDocumento/ExcluirDocumento";
import { exigirPermissao, Permissao } from "../../../shared/seguranca/permissoes";

export default class DocumentoRoutes implements ModelRoutes {
    constructor(private readonly http: Http, private readonly factory: RepositoryFactoryInterface) {}

    init(): void {
        this.http.downloadRoute("/uploads/:filename", true);

        this.http.route("get", "/pastas/:codigoPasta/documentos", true, async (params: any) =>
            new ListarDocumentos(this.factory).execute(params.codigoPasta));

        this.http.route("post", "/pastas/:codigoPasta/documentos", true, async (params: any, body: any) =>
            new EnviarDocumento(this.factory).execute({
                codigoPasta: params.codigoPasta,
                nome: body.nome,
                tamanhoBytes: Number(body.tamanhoBytes),
                dataEnvio: body.dataEnvio ? new Date(body.dataEnvio) : undefined,
                codigoAutor: exigirPermissao(body.user, Permissao.DOCUMENTOS_GERIR).codigo,
                arquivoUrl: body.arquivoUrl,
                extensao: body.extensao ?? null,
            }));

        this.http.uploadRoute("/pastas/:codigoPasta/documentos/upload", true, async (params: any, body: any, file: any) =>
            new EnviarDocumento(this.factory).execute({
                codigoPasta: params.codigoPasta,
                nome: String(body.nome || file.originalName),
                tamanhoBytes: file.size,
                codigoAutor: exigirPermissao(body.user, Permissao.DOCUMENTOS_GERIR).codigo,
                arquivoUrl: file.url,
                extensao: file.originalName.includes(".") ? file.originalName.split(".").pop() : null,
            }), (usuario: any) => exigirPermissao(usuario, Permissao.DOCUMENTOS_GERIR));

        this.http.route("put", "/documentos/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.DOCUMENTOS_GERIR);
            return new RenomearDocumento(this.factory).execute(params.codigo, body.nome);
        });

        this.http.route("delete", "/documentos/:codigo", true, async (params: any, body: any) => {
            exigirPermissao(body.user, Permissao.DOCUMENTOS_GERIR);
            return new ExcluirDocumento(this.factory).execute(params.codigo);
        });
    }
}
