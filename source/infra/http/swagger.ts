const codigo = {
    name: "codigo",
    in: "path",
    required: true,
    schema: { type: "string" },
};

const codigoPasta = {
    name: "codigoPasta",
    in: "path",
    required: true,
    schema: { type: "string" },
};

const jsonBody = (schema: object) => ({
    required: true,
    content: { "application/json": { schema } },
});

const operation = (
    tags: string[],
    summary: string,
    options: Record<string, any> = {},
) => ({
    tags,
    summary,
    responses: {
        "200": { description: "Operação realizada com sucesso." },
        "401": { description: "Token inválido ou expirado." },
        "403": { description: "Sem permissão para esta ação." },
        "422": { description: "Erro de validação ou regra de negócio." },
    },
    ...options,
});

const swaggerSpecification = {
    openapi: "3.0.3",
    info: {
        title: "Konvex Gestão de Projetos API",
        version: "1.0.0",
        description: "API de usuários, projetos, tarefas, capacitações, check-ins e documentos.",
    },
    servers: [{ url: process.env.SWAGGER_SERVER_URL ?? `http://localhost:${process.env.PORT ?? 5001}`, description: "Servidor da API" }],
    components: {
        securitySchemes: {
            AccessToken: {
                type: "apiKey",
                in: "header",
                name: "access-token",
                description: "Token JWT retornado pelo endpoint /auth/login. Informe o token sem o prefixo Bearer.",
            },
        },
        schemas: {
            Erro: { type: "object", properties: { message: { type: "string" } } },
            ProjetoInput: {
                type: "object",
                required: ["nome", "descricao", "dataInicio", "dataFim"],
                properties: {
                    nome: { type: "string" },
                    descricao: { type: "string" },
                    dataInicio: { type: "string", format: "date-time" },
                    dataFim: { type: "string", format: "date-time" },
                    codigosMembros: { type: "array", items: { type: "string" } },
                },
            },
            TarefaInput: {
                type: "object",
                required: ["codigoProjeto", "titulo", "dataInicio", "dataFim"],
                properties: {
                    codigoProjeto: { type: "string" },
                    titulo: { type: "string" },
                    dataInicio: { type: "string", format: "date-time" },
                    dataFim: { type: "string", format: "date-time" },
                    prioridade: { type: "string", enum: ["P1", "P2", "P3", "P4"] },
                    descricao: { type: "string", nullable: true },
                    codigosResponsaveis: { type: "array", items: { type: "string" } },
                    codigoDependencia: { type: "string", nullable: true },
                    checklist: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["texto", "feito"],
                            properties: {
                                codigo: { type: "string", format: "uuid" },
                                texto: { type: "string", maxLength: 300 },
                                feito: { type: "boolean" },
                            },
                        },
                    },
                },
            },
        },
        parameters: { codigo, codigoPasta },
    },
    security: [{ AccessToken: [] }],
    paths: {
        "/": {
            get: operation(["Sistema"], "Verificar se a API está ativa", {
                security: [],
            }),
        },
        "/auth/login": {
            post: operation(["Autenticação"], "Autenticar usuário", {
                security: [],
                requestBody: jsonBody({
                    type: "object",
                    required: ["email", "senha"],
                    properties: {
                        email: { type: "string", format: "email" },
                        senha: { type: "string" },
                    },
                }),
            }),
        },
        "/usuarios": {
            get: operation(["Usuários"], "Listar usuários"),
            post: operation(["Usuários"], "Cadastrar usuário (somente diretor/gerente)", {
                requestBody: jsonBody({
                    type: "object",
                    required: ["nome", "email", "senha", "perfil"],
                    properties: {
                        nome: { type: "string" },
                        email: { type: "string", format: "email" },
                        senha: { type: "string", minLength: 6 },
                        perfil: { type: "string", enum: ["diretor", "gerente", "membro"] },
                        senioridade: { type: "object", nullable: true },
                    },
                }),
            }),
        },
        "/senioridades": {
            get: operation(["Usuários"], "Listar senioridades e valores-hora"),
        },
        "/usuarios/{codigo}": {
            put: operation(["Usuários"], "Editar usuário", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({
                    type: "object",
                    required: ["nome", "email", "perfil"],
                    properties: {
                        nome: { type: "string" },
                        email: { type: "string", format: "email" },
                        perfil: { type: "string", enum: ["diretor", "gerente", "membro"] },
                        senioridade: { type: "object", nullable: true },
                    },
                }),
            }),
            delete: operation(["Usuários"], "Inativar usuário", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
            }),
        },
        "/projetos": {
            get: operation(["Projetos"], "Listar projetos", {
                parameters: [{ name: "codigoUsuario", in: "query", schema: { type: "string" } }],
            }),
            post: operation(["Projetos"], "Criar projeto", {
                requestBody: jsonBody({ $ref: "#/components/schemas/ProjetoInput" }),
            }),
        },
        "/projetos/{codigo}": {
            put: operation(["Projetos"], "Editar projeto", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({ $ref: "#/components/schemas/ProjetoInput" }),
            }),
            delete: operation(["Projetos"], "Excluir projeto", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
            }),
        },
        "/projetos/{codigo}/status": {
            patch: operation(["Projetos"], "Alternar status do projeto", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
            }),
        },
        "/tarefas": {
            get: operation(["Tarefas"], "Listar tarefas", {
                parameters: [
                    { name: "codigoProjeto", in: "query", schema: { type: "string" } },
                    { name: "codigoResponsavel", in: "query", schema: { type: "string" } },
                ],
            }),
            post: operation(["Tarefas"], "Criar tarefa", {
                requestBody: jsonBody({ $ref: "#/components/schemas/TarefaInput" }),
            }),
        },
        "/tarefas/{codigo}": {
            put: operation(["Tarefas"], "Editar tarefa", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({ $ref: "#/components/schemas/TarefaInput" }),
            }),
            delete: operation(["Tarefas"], "Excluir tarefa", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
            }),
        },
        "/tarefas/{codigo}/status": {
            patch: operation(["Tarefas"], "Alterar status da tarefa", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({
                    type: "object",
                    required: ["status"],
                    properties: { status: { type: "string", enum: ["pendente", "andamento", "concluida"] } },
                }),
            }),
        },
        "/capacitacoes": {
            get: operation(["Capacitações"], "Listar capacitações"),
            post: operation(["Capacitações"], "Criar capacitação (somente diretor)", {
                requestBody: jsonBody({ type: "object", required: ["titulo", "data", "hora", "codigoInstrutor", "vagas", "tipo", "sala"], properties: {
                    titulo: { type: "string" }, data: { type: "string", format: "date" }, hora: { type: "string", example: "14:00" },
                    codigoInstrutor: { type: "string" }, vagas: { type: "integer", minimum: 1 }, tipo: { type: "string", enum: ["mecanica", "computacao", "eletrica"] }, sala: { type: "string" }
                } })
            }),
        },
        "/capacitacoes/{codigo}/inscricoes": {
            post: operation(["Capacitações"], "Inscrever usuário em capacitação", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({
                    type: "object",
                    properties: { codigoUsuario: { type: "string" } },
                }),
            }),
        },
        "/capacitacoes/{codigo}/inscricoes/{codigoUsuario}": {
            delete: operation(["Capacitações"], "Cancelar inscrição", {
                parameters: [
                    { $ref: "#/components/parameters/codigo" },
                    { name: "codigoUsuario", in: "path", required: true, schema: { type: "string" } },
                ],
            }),
        },
        "/capacitacoes/{codigo}/feedbacks": {
            post: operation(["Capacitações"], "Enviar feedback da capacitação", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({
                    type: "object",
                    required: ["nota"],
                    properties: {
                        codigoUsuario: { type: "string" },
                        nota: { type: "number" },
                        bom: { type: "string" },
                        melhorar: { type: "string" },
                    },
                }),
            }),
        },
        "/feedbacks": {
            get: operation(["Capacitações"], "Listar feedbacks", {
                parameters: [{ name: "codigoUsuario", in: "query", schema: { type: "string" } }],
            }),
        },
        "/checkins": {
            get: operation(["Check-ins"], "Listar check-ins", {
                parameters: [{ name: "codigoUsuario", in: "query", schema: { type: "string" } }],
            }),
            post: operation(["Check-ins"], "Registrar check-in", {
                requestBody: jsonBody({
                    type: "object",
                    required: ["semana", "resumo", "aprendizados"],
                    properties: {
                        codigoUsuario: { type: "string" },
                        semana: { type: "string", format: "date" },
                        resumo: { type: "string" },
                        aprendizados: { type: "string" },
                        humor: { type: "integer", minimum: 1, maximum: 5 },
                        sentimento: { type: "string" },
                    },
                }),
            }),
            put: operation(["Check-ins"], "Editar check-in", {
                requestBody: jsonBody({
                    type: "object",
                    required: ["semana", "resumo", "aprendizados", "humor"],
                    properties: {
                        codigoUsuario: { type: "string" },
                        semana: { type: "string", format: "date" },
                        resumo: { type: "string" },
                        aprendizados: { type: "string" },
                        humor: { type: "integer", minimum: 1, maximum: 5 },
                        sentimento: { type: "string" },
                    },
                }),
            }),
        },
        "/pastas": {
            get: operation(["Documentos"], "Listar pastas"),
            post: operation(["Documentos"], "Criar pasta", {
                requestBody: jsonBody({
                    type: "object",
                    required: ["nome"],
                    properties: { nome: { type: "string" } },
                }),
            }),
        },
        "/pastas/{codigo}": {
            put: operation(["Documentos"], "Renomear pasta", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({
                    type: "object",
                    required: ["nome"],
                    properties: { nome: { type: "string" } },
                }),
            }),
            delete: operation(["Documentos"], "Excluir pasta", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
            }),
        },
        "/pastas/{codigoPasta}/documentos": {
            get: operation(["Documentos"], "Listar documentos de uma pasta", {
                parameters: [{ $ref: "#/components/parameters/codigoPasta" }],
            }),
            post: operation(["Documentos"], "Cadastrar documento por URL", {
                parameters: [{ $ref: "#/components/parameters/codigoPasta" }],
                requestBody: jsonBody({
                    type: "object",
                    required: ["nome", "tamanhoBytes", "arquivoUrl"],
                    properties: {
                        nome: { type: "string" },
                        tamanhoBytes: { type: "integer" },
                        arquivoUrl: { type: "string", format: "uri" },
                        extensao: { type: "string" },
                        codigoAutor: { type: "string" },
                    },
                }),
            }),
        },
        "/uploads/{filename}": {
            get: operation(["Documentos"], "Baixar documento enviado (autenticado)", {
                parameters: [{ name: "filename", in: "path", required: true, schema: { type: "string" } }],
                responses: { "200": { description: "Conteúdo binário do documento", content: { "application/octet-stream": { schema: { type: "string", format: "binary" } } } }, "404": { description: "Arquivo não encontrado." } },
            }),
        },
        "/pastas/{codigoPasta}/documentos/upload": {
            post: operation(["Documentos"], "Enviar arquivo para uma pasta (máximo 20 MB)", {
                parameters: [{ $ref: "#/components/parameters/codigoPasta" }],
                requestBody: {
                    required: true,
                    content: {
                        "application/octet-stream": { schema: { type: "string", format: "binary" } },
                    },
                },
            }),
        },
        "/documentos/{codigo}": {
            put: operation(["Documentos"], "Renomear documento", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
                requestBody: jsonBody({
                    type: "object",
                    required: ["nome"],
                    properties: { nome: { type: "string" } },
                }),
            }),
            delete: operation(["Documentos"], "Excluir documento", {
                parameters: [{ $ref: "#/components/parameters/codigo" }],
            }),
        },
    },
};

export default swaggerSpecification;

// Rotas da fase 1 (sessão, pessoas, configurações e equipe de projeto).
const json = { requestBody: jsonBody({ type: "object" }) };
const comCodigo = (extra: object = {}) => ({ parameters: [codigo], ...extra });
const participacao = {
    parameters: [codigo, { name: "codigoParticipacao", in: "path", required: true, schema: { type: "string" } }],
};
const rotasFase1: Record<string, Record<string, object>> = {
    "/auth/refresh": { post: operation(["Autenticação"], "Renovar a sessão com o refresh token", { security: [], ...json }) },
    "/auth/logout": { post: operation(["Autenticação"], "Encerrar a sessão (revoga o refresh token)", { security: [], ...json }) },
    "/auth/me": { get: operation(["Autenticação"], "Dados da pessoa logada") },
    "/auth/permissoes": { get: operation(["Autenticação"], "Ações liberadas e menu da pessoa logada") },
    "/auth/senha": { put: operation(["Autenticação"], "Trocar a própria senha", json) },
    "/auth/perfil": { put: operation(["Autenticação"], "Editar os próprios dados de contato (telefone, LinkedIn, curso, semestre, bio)", json) },
    "/usuarios/{codigo}": {
        get: operation(["Usuários"], "Consultar pessoa", comCodigo()),
    },
    "/usuarios/{codigo}/perfil": { get: operation(["Usuários"], "Perfil: projetos, histórico e capacitações (RF-013)", comCodigo()) },
    "/usuarios/{codigo}/status": { patch: operation(["Usuários"], "Mudar status: ativo, trainee, alumni, inativo (RF-011)", comCodigo(json)) },
    "/usuarios/{codigo}/senha": { put: operation(["Usuários"], "Redefinir a senha de uma pessoa (gestores)", comCodigo(json)) },
    "/areas": {
        get: operation(["Configurações"], "Listar áreas"),
        post: operation(["Configurações"], "Criar área (diretores)", json),
    },
    "/areas/{codigo}": { put: operation(["Configurações"], "Editar área (diretores)", comCodigo(json)) },
    "/cargos": {
        get: operation(["Configurações"], "Listar cargos"),
        post: operation(["Configurações"], "Criar cargo (diretores)", json),
    },
    "/cargos/{codigo}": { put: operation(["Configurações"], "Editar cargo (diretores)", comCodigo(json)) },
    "/senioridades/{codigo}": { put: operation(["Configurações"], "Editar nome e ordem da senioridade (diretores)", comCodigo(json)) },
    "/habilidades": { get: operation(["Configurações"], "Listar habilidades e tecnologias cadastradas") },
    "/projetos/{codigo}/membros": { post: operation(["Projetos"], "Adicionar pessoa à equipe (RF-022)", comCodigo(json)) },
    "/projetos/{codigo}/membros/{codigoParticipacao}": { put: operation(["Projetos"], "Editar função e alocação", { ...participacao, ...json }) },
    "/projetos/{codigo}/membros/{codigoParticipacao}/encerrar": { post: operation(["Projetos"], "Encerrar participação", { ...participacao, ...json }) },
};
const caminhos = (swaggerSpecification as any).paths;
for (const [caminho, metodos] of Object.entries(rotasFase1)) {
    caminhos[caminho] = { ...(caminhos[caminho] ?? {}), ...metodos };
}
caminhos["/senioridades"].post = operation(["Configurações"], "Criar senioridade (diretores)", json);
caminhos["/projetos/{codigo}"] = { ...(caminhos["/projetos/{codigo}"] ?? {}), get: operation(["Projetos"], "Consultar projeto", comCodigo()) };
