-- 002: fase 1 do plano (doc 01, seção 9): pessoas, áreas, cargos, histórico,
-- refresh token e projetos com equipe e alocação.
-- Referências: RF-001, RF-010 a RF-016, RF-020 a RF-024, RN-01 a RN-04,
-- ADR-006, ADR-007 e extensões propostas no doc 04, seção 6.

-- Tipos novos -----------------------------------------------------------------

CREATE TYPE status_pessoa AS ENUM ('ativo', 'trainee', 'alumni', 'inativo');
CREATE TYPE tipo_habilidade AS ENUM ('habilidade', 'tecnologia');
CREATE TYPE prioridade_projeto AS ENUM ('alta', 'media', 'baixa');

-- RF-021: Em andamento (em_execucao), Atenção, Bloqueado, Concluído, Arquivado.
ALTER TYPE status_projeto ADD VALUE IF NOT EXISTS 'atencao';
ALTER TYPE status_projeto ADD VALUE IF NOT EXISTS 'bloqueado';
ALTER TYPE status_projeto ADD VALUE IF NOT EXISTS 'arquivado';

-- Configurações (ADR-007) -------------------------------------------------------

CREATE TABLE areas (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(80) NOT NULL UNIQUE,
    area_pai_codigo UUID REFERENCES areas(codigo) ON DELETE RESTRICT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT area_nao_e_pai_de_si CHECK (area_pai_codigo IS NULL OR area_pai_codigo <> codigo)
);

CREATE TABLE cargos (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(80) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE senioridades ADD COLUMN ordem SMALLINT NOT NULL DEFAULT 0;
UPDATE senioridades SET ordem = 2 WHERE codigo = 'junior';
UPDATE senioridades SET ordem = 3 WHERE codigo = 'pleno';
UPDATE senioridades SET ordem = 4 WHERE codigo = 'senior';
-- RF-050 lista Trainee e Liderança. O valor-hora fica 0 até a Presidência
-- definir as taxas (QA-01); a precificação é da fase 3.
INSERT INTO senioridades (codigo, nome, valor_hora, ordem) VALUES
    ('trainee', 'Trainee', 0, 1),
    ('lideranca', 'Liderança', 0, 5)
ON CONFLICT (codigo) DO NOTHING;

-- Pessoas (RF-010 a RF-016) -----------------------------------------------------

ALTER TABLE usuarios
    ADD COLUMN nome_exibicao VARCHAR(60),
    ADD COLUMN avatar_url TEXT,
    ADD COLUMN telefone VARCHAR(30),
    ADD COLUMN linkedin_url TEXT,
    ADD COLUMN curso VARCHAR(80),
    ADD COLUMN semestre SMALLINT CHECK (semestre IS NULL OR semestre BETWEEN 1 AND 20),
    ADD COLUMN area_codigo UUID REFERENCES areas(codigo) ON DELETE RESTRICT,
    ADD COLUMN cargo_codigo UUID REFERENCES cargos(codigo) ON DELETE RESTRICT,
    ADD COLUMN data_entrada DATE,
    ADD COLUMN data_saida DATE,
    ADD COLUMN status status_pessoa NOT NULL DEFAULT 'ativo',
    ADD COLUMN bio TEXT,
    ADD CONSTRAINT periodo_pessoa_valido CHECK (data_saida IS NULL OR data_entrada IS NULL OR data_saida >= data_entrada);

-- A coluna ativo continua existindo (e é mantida pelo código) para não quebrar
-- consultas antigas; a fonte da verdade passa a ser status.
UPDATE usuarios SET status = CASE WHEN ativo THEN 'ativo'::status_pessoa ELSE 'inativo'::status_pessoa END;

CREATE INDEX idx_usuarios_status ON usuarios(status);
CREATE INDEX idx_usuarios_area ON usuarios(area_codigo);

CREATE TABLE habilidades (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(60) NOT NULL,
    tipo tipo_habilidade NOT NULL DEFAULT 'habilidade'
);
CREATE UNIQUE INDEX idx_habilidades_nome_tipo ON habilidades (lower(nome), tipo);

CREATE TABLE usuario_habilidades (
    usuario_codigo UUID NOT NULL REFERENCES usuarios(codigo) ON DELETE RESTRICT,
    habilidade_codigo UUID NOT NULL REFERENCES habilidades(codigo) ON DELETE CASCADE,
    PRIMARY KEY (usuario_codigo, habilidade_codigo)
);

-- RF-014 e RN-02: o histórico nunca é sobrescrito.
CREATE TABLE historico_cargos (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_codigo UUID NOT NULL REFERENCES usuarios(codigo) ON DELETE RESTRICT,
    cargo_anterior_codigo UUID REFERENCES cargos(codigo) ON DELETE RESTRICT,
    cargo_novo_codigo UUID REFERENCES cargos(codigo) ON DELETE RESTRICT,
    data_vigencia DATE NOT NULL,
    registrado_por UUID REFERENCES usuarios(codigo) ON DELETE RESTRICT,
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_historico_cargos_usuario ON historico_cargos(usuario_codigo);

CREATE TABLE historico_areas (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_codigo UUID NOT NULL REFERENCES usuarios(codigo) ON DELETE RESTRICT,
    area_anterior_codigo UUID REFERENCES areas(codigo) ON DELETE RESTRICT,
    area_nova_codigo UUID REFERENCES areas(codigo) ON DELETE RESTRICT,
    data_vigencia DATE NOT NULL,
    registrado_por UUID REFERENCES usuarios(codigo) ON DELETE RESTRICT,
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_historico_areas_usuario ON historico_areas(usuario_codigo);

-- Sessão (RF-001 e doc 04, QA-22) -----------------------------------------------

CREATE TABLE refresh_tokens (
    codigo UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_codigo UUID NOT NULL REFERENCES usuarios(codigo) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expira_em TIMESTAMPTZ NOT NULL,
    revogado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens(usuario_codigo);

-- Projetos (RF-020 a RF-024) ----------------------------------------------------

ALTER TABLE projetos
    ADD COLUMN referencia VARCHAR(30),
    ADD COLUMN objetivo TEXT,
    ADD COLUMN cliente_nome VARCHAR(150),
    ADD COLUMN cliente_codigo UUID,
    ADD COLUMN prioridade prioridade_projeto NOT NULL DEFAULT 'media',
    ADD COLUMN progresso SMALLINT NOT NULL DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
    ADD COLUMN responsavel_codigo UUID REFERENCES usuarios(codigo) ON DELETE RESTRICT,
    ADD COLUMN area_codigo UUID REFERENCES areas(codigo) ON DELETE RESTRICT,
    ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';
-- cliente_codigo fica reservado e nulo até existir o CRM (doc 03, seção 9).
CREATE UNIQUE INDEX idx_projetos_referencia ON projetos (lower(referencia)) WHERE referencia IS NOT NULL;

-- Participação com função, responsabilidade, alocação e período (RF-022, RN-03).
-- A mesma pessoa pode sair e voltar ao projeto: cada passagem é uma linha.
ALTER TABLE projeto_membros
    ADD COLUMN codigo UUID NOT NULL DEFAULT gen_random_uuid(),
    ADD COLUMN funcao VARCHAR(80),
    ADD COLUMN responsabilidades TEXT,
    ADD COLUMN alocacao SMALLINT NOT NULL DEFAULT 0 CHECK (alocacao BETWEEN 0 AND 100),
    ADD COLUMN data_entrada DATE,
    ADD COLUMN data_saida DATE;

UPDATE projeto_membros pm
SET data_entrada = p.data_inicio
FROM projetos p
WHERE p.codigo = pm.projeto_codigo;

ALTER TABLE projeto_membros
    ALTER COLUMN data_entrada SET NOT NULL,
    ALTER COLUMN data_entrada SET DEFAULT CURRENT_DATE,
    ADD CONSTRAINT periodo_participacao_valido CHECK (data_saida IS NULL OR data_saida >= data_entrada);

ALTER TABLE projeto_membros DROP CONSTRAINT projeto_membros_pkey;
ALTER TABLE projeto_membros ADD PRIMARY KEY (codigo);
CREATE UNIQUE INDEX idx_projeto_membros_ativo ON projeto_membros (projeto_codigo, usuario_codigo) WHERE data_saida IS NULL;
CREATE INDEX IF NOT EXISTS idx_projeto_membros_projeto_codigo ON projeto_membros(projeto_codigo);

-- Pessoas nunca são excluídas (ADR-006) ----------------------------------------
-- Troca ON DELETE CASCADE por RESTRICT em tudo que aponta para usuarios, para
-- que um DELETE acidental não apague vínculos históricos.

CREATE FUNCTION pg_temp.restringir_fk(tabela TEXT, coluna TEXT) RETURNS VOID AS $$
DECLARE
    restricao TEXT;
BEGIN
    SELECT c.conname INTO restricao
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.contype = 'f'
      AND c.conrelid = tabela::regclass
      AND c.confrelid = 'usuarios'::regclass
      AND a.attname = coluna;

    IF restricao IS NOT NULL THEN
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', tabela, restricao);
    END IF;

    EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES usuarios(codigo) ON DELETE RESTRICT',
        tabela, tabela || '_' || coluna || '_fkey', coluna
    );
END;
$$ LANGUAGE plpgsql;

SELECT pg_temp.restringir_fk('projeto_membros', 'usuario_codigo');
SELECT pg_temp.restringir_fk('tarefa_responsaveis', 'usuario_codigo');
SELECT pg_temp.restringir_fk('capacitacao_inscricoes', 'usuario_codigo');
SELECT pg_temp.restringir_fk('capacitacao_feedbacks', 'usuario_codigo');
SELECT pg_temp.restringir_fk('checkins', 'usuario_codigo');
