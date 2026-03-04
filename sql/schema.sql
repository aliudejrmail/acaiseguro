-- Schema para o banco de dados acaiseguro
-- PostgreSQL

-- Tabela de Usuários (Acesso ao sistema)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vincular batedores ao usuário logado (migration segura)
ALTER TABLE batedores ADD COLUMN IF NOT EXISTS usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL;

-- Tabela de Batedores (Cadastro)
CREATE TABLE IF NOT EXISTS batedores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) UNIQUE NOT NULL,
    telefone VARCHAR(15) NOT NULL CHECK (telefone ~ '^\(\d{2}\) \d{5}-\d{4}$'),
    nome_fantasia VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    endereco TEXT NOT NULL,
    alvara VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Check-lists
CREATE TABLE IF NOT EXISTS checklists (
    id SERIAL PRIMARY KEY,
    batedor_id INTEGER REFERENCES batedores(id) ON DELETE CASCADE,
    data_checklist TIMESTAMP NOT NULL,
    higiene_manipulador JSONB NOT NULL,
    limpeza_ambiente JSONB NOT NULL,
    controle_pragas JSONB NOT NULL,
    qualidade_agua JSONB NOT NULL,
    manutencao_equipamentos JSONB NOT NULL,
    observacoes TEXT,
    itens_conformes INTEGER NOT NULL,
    total_itens INTEGER NOT NULL,
    percentual_conformidade DECIMAL(5, 2) NOT NULL,
    conforme BOOLEAN NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Cálculos de Cloração
CREATE TABLE IF NOT EXISTS calculos_cloracao (
    id SERIAL PRIMARY KEY,
    batedor_id INTEGER REFERENCES batedores(id) ON DELETE CASCADE,
    data_calculo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    quantidade_agua DECIMAL(10, 2) NOT NULL,
    concentracao_cloro DECIMAL(5, 2) NOT NULL,
    resultado_ml DECIMAL(10, 2) NOT NULL
);

-- Tabela de Selos
CREATE TABLE IF NOT EXISTS selos (
    id SERIAL PRIMARY KEY,
    batedor_id INTEGER REFERENCES batedores(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('prata', 'ouro')),
    data_emissao TIMESTAMP NOT NULL,
    data_validade TIMESTAMP NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Requisitos de Selos (Progresso)
CREATE TABLE IF NOT EXISTS requisitos_selos (
    id SERIAL PRIMARY KEY,
    batedor_id INTEGER REFERENCES batedores(id) ON DELETE CASCADE,
    tipo_selo VARCHAR(20) NOT NULL CHECK (tipo_selo IN ('prata', 'ouro')),
    numero_requisito INTEGER NOT NULL,
    status BOOLEAN DEFAULT FALSE,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(batedor_id, tipo_selo, numero_requisito)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_batedores_cpf ON batedores(cpf);
CREATE INDEX IF NOT EXISTS idx_checklists_batedor ON checklists(batedor_id);
CREATE INDEX IF NOT EXISTS idx_checklists_data ON checklists(data_checklist);

-- Índice único para garantir apenas 1 check-list por dia por batedor
DROP INDEX IF EXISTS idx_checklists_batedor_data_unico;
CREATE UNIQUE INDEX idx_checklists_batedor_data_unico ON checklists(batedor_id, DATE(data_checklist));

CREATE INDEX IF NOT EXISTS idx_calculos_batedor ON calculos_cloracao(batedor_id);
CREATE INDEX IF NOT EXISTS idx_selos_batedor ON selos(batedor_id);
CREATE INDEX IF NOT EXISTS idx_selos_ativo ON selos(ativo);
CREATE INDEX IF NOT EXISTS idx_requisitos_batedor ON requisitos_selos(batedor_id);

-- Comentários nas tabelas
COMMENT ON TABLE batedores IS 'Cadastro completo dos batedores de açaí';
COMMENT ON TABLE checklists IS 'Histórico de check-lists de Boas Práticas de Fabricação';
COMMENT ON TABLE calculos_cloracao IS 'Histórico de cálculos de cloração realizados';
COMMENT ON TABLE selos IS 'Selos de certificação emitidos para os batedores';
COMMENT ON TABLE requisitos_selos IS 'Progresso dos requisitos para obtenção de selos';

-- Views úteis

-- View: Batedores com Selo Ativo
CREATE OR REPLACE VIEW v_batedores_com_selo AS
SELECT 
    b.id,
    b.nome,
    b.nome_fantasia,
    b.cpf,
    s.tipo AS tipo_selo,
    s.data_emissao,
    s.data_validade
FROM batedores b
INNER JOIN selos s ON b.id = s.batedor_id
WHERE s.ativo = TRUE AND s.data_validade > CURRENT_TIMESTAMP;

-- View: Estatísticas de Conformidade por Batedor
CREATE OR REPLACE VIEW v_estatisticas_conformidade AS
SELECT 
    b.id,
    b.nome,
    b.nome_fantasia,
    COUNT(c.id) AS total_checklists,
    AVG(c.percentual_conformidade) AS media_conformidade,
    COUNT(CASE WHEN c.conforme THEN 1 END) AS checklists_conformes,
    COUNT(CASE WHEN NOT c.conforme THEN 1 END) AS checklists_nao_conformes,
    MAX(c.data_checklist) AS ultimo_checklist
FROM batedores b
LEFT JOIN checklists c ON b.id = c.batedor_id
GROUP BY b.id, b.nome, b.nome_fantasia;

-- View: Progresso para Selos
CREATE OR REPLACE VIEW v_progresso_selos AS
SELECT 
    b.id AS batedor_id,
    b.nome,
    tipo_selo,
    COUNT(*) FILTER (WHERE status = TRUE) AS requisitos_completos,
    COUNT(*) AS total_requisitos,
    ROUND((COUNT(*) FILTER (WHERE status = TRUE)::DECIMAL / COUNT(*)) * 100, 2) AS percentual_completo
FROM batedores b
LEFT JOIN requisitos_selos rs ON b.id = rs.batedor_id
GROUP BY b.id, b.nome, rs.tipo_selo;

-- Função para atualizar timestamp de atualização
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar automaticamente data_atualizacao
DROP TRIGGER IF EXISTS update_batedores_updated_at ON batedores;
CREATE TRIGGER update_batedores_updated_at
    BEFORE UPDATE ON batedores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar validade do selo
CREATE OR REPLACE FUNCTION atualizar_status_selos()
RETURNS void AS $$
BEGIN
    UPDATE selos
    SET ativo = FALSE
    WHERE data_validade <= CURRENT_TIMESTAMP AND ativo = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Dados iniciais de exemplo (opcional - remover em produção)
-- INSERT INTO batedores (nome, cpf, telefone, nome_fantasia, endereco, alvara)
-- VALUES ('João Silva', '123.456.789-00', '(91) 98765-4321', 'Açaí do João', 'Rua das Palmeiras, 123', 'ALV-2026-001');
