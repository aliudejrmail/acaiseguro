-- Schema para o sistema de Gestor/Autoridade Sanitária
-- PostgreSQL

-- Adicionar campo role na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'batedor' CHECK (role IN ('batedor', 'gestor'));

-- Criar índice para role
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);

-- Adicionar campo status_aprovacao na tabela batedores
ALTER TABLE batedores ADD COLUMN IF NOT EXISTS status_aprovacao VARCHAR(20) DEFAULT 'pendente' CHECK (status_aprovacao IN ('pendente', 'aprovado', 'reprovado', 'em_analise'));
ALTER TABLE batedores ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMP;
ALTER TABLE batedores ADD COLUMN IF NOT EXISTS gestor_responsavel_id INTEGER REFERENCES usuarios(id);

-- Criar índice para status_aprovacao
CREATE INDEX IF NOT EXISTS idx_batedores_status ON batedores(status_aprovacao);

-- Adicionar campos para documentação no check-list
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS editado_por_gestor BOOLEAN DEFAULT FALSE;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS gestor_id INTEGER REFERENCES usuarios(id);
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS observacoes_gestor TEXT;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS data_edicao_gestor TIMESTAMP;

-- Tabela de Análises/Laudos realizados pelo gestor
CREATE TABLE IF NOT EXISTS analises (
    id SERIAL PRIMARY KEY,
    batedor_id INTEGER REFERENCES batedores(id) ON DELETE CASCADE,
    gestor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo_analise VARCHAR(50) NOT NULL, -- 'inicial', 'renovacao', 'fiscalizacao', 'reclamacao'
    data_analise TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resultado VARCHAR(20) NOT NULL CHECK (resultado IN ('aprovado', 'reprovado', 'pendente_correcoes')),
    pontuacao DECIMAL(5, 2),
    pontos_criticos TEXT[], -- Array de pontos críticos encontrados
    pontos_positivos TEXT[], -- Array de pontos positivos
    laudo TEXT NOT NULL,
    prazo_correcao DATE, -- Se houver pendências
    anexos JSONB, -- Array de URLs/Base64 de fotos/documentos
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para analises
CREATE INDEX IF NOT EXISTS idx_analises_batedor ON analises(batedor_id);
CREATE INDEX IF NOT EXISTS idx_analises_gestor ON analises(gestor_id);
CREATE INDEX IF NOT EXISTS idx_analises_resultado ON analises(resultado);
CREATE INDEX IF NOT EXISTS idx_analises_data ON analises(data_analise);

-- Tabela de Histórico de Ações do Gestor (auditoria)
CREATE TABLE IF NOT EXISTS historico_gestor (
    id SERIAL PRIMARY KEY,
    gestor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    batedor_id INTEGER REFERENCES batedores(id) ON DELETE CASCADE,
    acao VARCHAR(100) NOT NULL, -- 'checklist_editado', 'status_alterado', 'analise_criada', etc
    detalhes JSONB, -- Dados detalhados da ação
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para histórico
CREATE INDEX IF NOT EXISTS idx_historico_gestor ON historico_gestor(gestor_id);
CREATE INDEX IF NOT EXISTS idx_historico_batedor ON historico_gestor(batedor_id);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico_gestor(data_acao);

-- Tabela de Notificações para os batedores
CREATE TABLE IF NOT EXISTS notificacoes (
    id SERIAL PRIMARY KEY,
    batedor_id INTEGER REFERENCES batedores(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL, -- 'aprovacao', 'reprovacao', 'pendencia', 'vencimento_selo', etc
    titulo VARCHAR(255) NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN DEFAULT FALSE,
    criada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para notificações
CREATE INDEX IF NOT EXISTS idx_notificacoes_batedor ON notificacoes(batedor_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);

-- Comentários nas tabelas
COMMENT ON TABLE analises IS 'Análises e laudos realizados por gestores/autoridades sanitárias';
COMMENT ON TABLE historico_gestor IS 'Histórico de todas as ações realizadas por gestores (auditoria)';
COMMENT ON TABLE notificacoes IS 'Notificações enviadas aos batedores sobre status e pendências';

-- Função para registrar ação do gestor automaticamente
CREATE OR REPLACE FUNCTION registrar_acao_gestor()
RETURNS TRIGGER AS $$
BEGIN
    -- Registrar no histórico quando uma análise é criada
    IF TG_OP = 'INSERT' AND TG_TABLE_NAME = 'analises' THEN
        INSERT INTO historico_gestor (gestor_id, batedor_id, acao, detalhes)
        VALUES (NEW.gestor_id, NEW.batedor_id, 'analise_criada', 
                jsonb_build_object('tipo', NEW.tipo_analise, 'resultado', NEW.resultado));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar análises
DROP TRIGGER IF EXISTS trg_registrar_analise ON analises;
CREATE TRIGGER trg_registrar_analise
    AFTER INSERT ON analises
    FOR EACH ROW
    EXECUTE FUNCTION registrar_acao_gestor();

-- Função para atualizar timestamp de atualização em análises
CREATE OR REPLACE FUNCTION update_analise_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS trg_update_analise_updated_at ON analises;
CREATE TRIGGER trg_update_analise_updated_at
    BEFORE UPDATE ON analises
    FOR EACH ROW
    EXECUTE FUNCTION update_analise_updated_at();

-- View: Dashboard do Gestor - Resumo geral
CREATE OR REPLACE VIEW v_dashboard_gestor AS
SELECT 
    COUNT(DISTINCT b.id) AS total_estabelecimentos,
    COUNT(DISTINCT CASE WHEN b.status_aprovacao = 'aprovado' THEN b.id END) AS aprovados,
    COUNT(DISTINCT CASE WHEN b.status_aprovacao = 'pendente' THEN b.id END) AS pendentes,
    COUNT(DISTINCT CASE WHEN b.status_aprovacao = 'em_analise' THEN b.id END) AS em_analise,
    COUNT(DISTINCT CASE WHEN b.status_aprovacao = 'reprovado' THEN b.id END) AS reprovados,
    COUNT(c.id) AS total_checklists,
    COUNT(DISTINCT CASE WHEN c.data_checklist >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN c.id END) AS checklists_30dias,
    AVG(c.percentual_conformidade) AS media_geral_conformidade,
    COUNT(DISTINCT s.id) AS selos_ativos
FROM batedores b
LEFT JOIN checklists c ON b.id = c.batedor_id
LEFT JOIN selos s ON b.id = s.batedor_id AND s.ativo = TRUE AND s.data_validade > CURRENT_TIMESTAMP;

-- View: Batedores com últimas informações (para lista)
CREATE OR REPLACE VIEW v_batedores_resumo AS
SELECT 
    b.id,
    b.nome,
    b.cpf,
    b.nome_fantasia,
    b.endereco,
    b.telefone,
    b.status_aprovacao,
    b.data_cadastro,
    b.data_aprovacao,
    COUNT(DISTINCT c.id) AS total_checklists,
    MAX(c.data_checklist) AS ultimo_checklist,
    AVG(c.percentual_conformidade) AS media_conformidade,
    s.tipo AS tipo_selo_ativo,
    s.data_validade AS validade_selo,
    (SELECT COUNT(*) FROM analises a WHERE a.batedor_id = b.id) AS total_analises,
    (SELECT MAX(data_analise) FROM analises a WHERE a.batedor_id = b.id) AS ultima_analise
FROM batedores b
LEFT JOIN checklists c ON b.id = c.batedor_id
LEFT JOIN selos s ON b.id = s.batedor_id AND s.ativo = TRUE AND s.data_validade > CURRENT_TIMESTAMP
GROUP BY b.id, b.nome, b.cpf, b.nome_fantasia, b.endereco, b.telefone, 
         b.status_aprovacao, b.data_cadastro, b.data_aprovacao, s.tipo, s.data_validade
ORDER BY b.data_cadastro DESC;

-- Inserir gestor padrão para testes (senha: gestor123)
-- Hash bcrypt de 'gestor123' com salt 10
INSERT INTO usuarios (nome, email, senha, role)
VALUES ('Gestor Padrão', 'gestor@acaiseguro.com', '$2a$10$YH7Ew5pFJYx9K2vQvFZ9GuXqYpYRQJKjJG5XYqFZWX8QP.qH.Ew8m', 'gestor')
ON CONFLICT (email) DO UPDATE SET role = 'gestor';

-- Comentário final
COMMENT ON VIEW v_dashboard_gestor IS 'Resumo geral para dashboard do gestor';
COMMENT ON VIEW v_batedores_resumo IS 'Lista resumida de batedores com informações relevantes';
