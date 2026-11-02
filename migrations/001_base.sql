-- 001: estado do banco até 13/10/2026 (antigo source/infra/database/schema.sql).
-- Idempotente: pode ser aplicada sobre um banco que já recebeu o schema.sql à mão,
-- e nesse caso só registra a migração como aplicada.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'perfil_usuario') THEN
        CREATE TYPE perfil_usuario AS ENUM ('diretor', 'gerente', 'membro');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_projeto') THEN
        CREATE TYPE status_projeto AS ENUM ('em_execucao', 'concluido');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_tarefa') THEN
        CREATE TYPE status_tarefa AS ENUM ('pendente', 'andamento', 'concluida');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridade_tarefa') THEN
        CREATE TYPE prioridade_tarefa AS ENUM ('P1', 'P2', 'P3', 'P4');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_capacitacao') THEN
        CREATE TYPE tipo_capacitacao AS ENUM ('mecanica', 'computacao', 'eletrica');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS senioridades (
    codigo VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(30) NOT NULL,
    valor_hora NUMERIC(10,2) NOT NULL DEFAULT 0
);

INSERT INTO senioridades (codigo, nome, valor_hora) VALUES
    ('junior', 'Júnior', 45),
    ('pleno', 'Pleno', 75),
    ('senior', 'Sênior', 120)
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS usuarios (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    perfil perfil_usuario NOT NULL DEFAULT 'membro',
    senioridade_codigo VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    senha_hash VARCHAR(255),
    CONSTRAINT fk_usuarios_senioridade
        FOREIGN KEY (senioridade_codigo)
        REFERENCES senioridades(codigo)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS projetos (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status status_projeto NOT NULL DEFAULT 'em_execucao'
);

CREATE TABLE IF NOT EXISTS projeto_membros (
    projeto_codigo UUID NOT NULL,
    usuario_codigo UUID NOT NULL,
    PRIMARY KEY (projeto_codigo, usuario_codigo),
    FOREIGN KEY (projeto_codigo) REFERENCES projetos(codigo) ON DELETE CASCADE,
    FOREIGN KEY (usuario_codigo) REFERENCES usuarios(codigo) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_projeto_membros_usuario_codigo ON projeto_membros(usuario_codigo);

CREATE TABLE IF NOT EXISTS tarefas (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_codigo UUID NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status status_tarefa NOT NULL DEFAULT 'pendente',
    prioridade prioridade_tarefa NOT NULL DEFAULT 'P3',
    data_conclusao DATE,
    depende_de_codigo UUID,
    FOREIGN KEY (projeto_codigo) REFERENCES projetos(codigo) ON DELETE CASCADE,
    FOREIGN KEY (depende_de_codigo) REFERENCES tarefas(codigo) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_tarefas_projeto_codigo ON tarefas(projeto_codigo);
CREATE INDEX IF NOT EXISTS idx_tarefas_status_data_fim ON tarefas(status, data_fim);

CREATE TABLE IF NOT EXISTS tarefa_responsaveis (
    tarefa_codigo UUID NOT NULL,
    usuario_codigo UUID NOT NULL,
    PRIMARY KEY (tarefa_codigo, usuario_codigo),
    FOREIGN KEY (tarefa_codigo) REFERENCES tarefas(codigo) ON DELETE CASCADE,
    FOREIGN KEY (usuario_codigo) REFERENCES usuarios(codigo) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tarefa_responsaveis_usuario_codigo ON tarefa_responsaveis(usuario_codigo);

CREATE TABLE IF NOT EXISTS tarefa_checklist_itens (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tarefa_codigo UUID NOT NULL,
    texto VARCHAR(300) NOT NULL,
    feito BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (tarefa_codigo) REFERENCES tarefas(codigo) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS capacitacoes (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(200) NOT NULL,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    instrutor_codigo UUID NOT NULL,
    vagas INTEGER NOT NULL,
    tipo tipo_capacitacao NOT NULL,
    sala VARCHAR(60) NOT NULL,
    FOREIGN KEY (instrutor_codigo) REFERENCES usuarios(codigo) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS capacitacao_inscricoes (
    capacitacao_codigo UUID NOT NULL,
    usuario_codigo UUID NOT NULL,
    PRIMARY KEY (capacitacao_codigo, usuario_codigo),
    FOREIGN KEY (capacitacao_codigo) REFERENCES capacitacoes(codigo) ON DELETE CASCADE,
    FOREIGN KEY (usuario_codigo) REFERENCES usuarios(codigo) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_capacitacao_inscricoes_usuario_codigo ON capacitacao_inscricoes(usuario_codigo);

CREATE TABLE IF NOT EXISTS capacitacao_feedbacks (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capacitacao_codigo UUID NOT NULL,
    usuario_codigo UUID NOT NULL,
    nota SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
    bom TEXT,
    melhorar TEXT,
    data DATE NOT NULL,
    FOREIGN KEY (capacitacao_codigo) REFERENCES capacitacoes(codigo) ON DELETE CASCADE,
    FOREIGN KEY (usuario_codigo) REFERENCES usuarios(codigo) ON DELETE CASCADE,
    UNIQUE (capacitacao_codigo, usuario_codigo)
);

CREATE TABLE IF NOT EXISTS checkins (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_codigo UUID NOT NULL,
    semana DATE NOT NULL,
    humor SMALLINT NOT NULL DEFAULT 3 CHECK (humor BETWEEN 1 AND 5),
    resumo TEXT NOT NULL,
    aprendizados TEXT NOT NULL,
    sentimento TEXT,
    FOREIGN KEY (usuario_codigo) REFERENCES usuarios(codigo) ON DELETE CASCADE,
    UNIQUE (usuario_codigo, semana)
);
CREATE INDEX IF NOT EXISTS idx_checkins_semana ON checkins(semana);

CREATE TABLE IF NOT EXISTS pastas (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(120) NOT NULL
);

CREATE TABLE IF NOT EXISTS documentos (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pasta_codigo UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    extensao VARCHAR(5),
    tamanho_bytes BIGINT NOT NULL,
    data_envio DATE NOT NULL,
    autor_codigo UUID NOT NULL,
    arquivo_url TEXT NOT NULL,
    FOREIGN KEY (pasta_codigo) REFERENCES pastas(codigo) ON DELETE CASCADE,
    FOREIGN KEY (autor_codigo) REFERENCES usuarios(codigo) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_documentos_pasta_codigo ON documentos(pasta_codigo);
