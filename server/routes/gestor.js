const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { autenticar, autorizar } = require('../middleware/authMiddleware');

// ==================== CONFIGURAÇÃO DE PROTEÇÃO ====================

// Todas as rotas de gestor exigem autenticação e role 'gestor'
router.use(autenticar);
router.use(autorizar('gestor'));

// (O middleware global acima já gerencia a autenticação e autorização)

// ==================== ROTAS DE DASHBOARD ====================

// GET - Dashboard com estatísticas gerais
router.get('/dashboard', async (req, res) => {
    try {
        const dashboard = await db.query('SELECT * FROM v_dashboard_gestor');

        // Buscar análises recentes
        const analisesRecentes = await db.query(`
            SELECT a.*, b.nome_fantasia, b.nome, u.nome as gestor_nome
            FROM analises a
            INNER JOIN batedores b ON a.batedor_id = b.id
            LEFT JOIN usuarios u ON a.gestor_id = u.id
            ORDER BY a.data_analise DESC
            LIMIT 10
        `);

        // Buscar pendências (estabelecimentos aguardando análise)
        const pendencias = await db.query(`
            SELECT COUNT(*) as total
            FROM batedores
            WHERE status_aprovacao IN ('pendente', 'em_analise')
        `);

        // Selos a vencer nos próximos 30 dias
        const selosVencendo = await db.query(`
            SELECT s.*, b.nome_fantasia, b.telefone
            FROM selos s
            INNER JOIN batedores b ON s.batedor_id = b.id
            WHERE s.ativo = TRUE 
            AND s.data_validade BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '30 days'
            ORDER BY s.data_validade ASC
        `);

        res.json({
            success: true,
            data: {
                resumo: dashboard.rows[0] || {},
                analisesRecentes: analisesRecentes.rows,
                pendencias: parseInt(pendencias.rows[0].total),
                selosVencendo: selosVencendo.rows
            }
        });
    } catch (error) {
        console.error('Erro ao buscar dashboard:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
});

// ==================== ROTAS DE LISTAGEM DE BATEDORES ====================

// GET - Listar todos os batedores com filtros
router.get('/batedores', async (req, res) => {
    try {
        const { status, busca, ordenar } = req.query;

        let query = 'SELECT * FROM v_batedores_resumo WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        // Filtro por status
        if (status && status !== 'todos') {
            query += ` AND status_aprovacao = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // Busca por nome ou CPF
        if (busca) {
            query += ` AND (nome ILIKE $${paramIndex} OR cpf ILIKE $${paramIndex} OR nome_fantasia ILIKE $${paramIndex})`;
            params.push(`%${busca}%`);
            paramIndex++;
        }

        // Ordenação
        if (ordenar === 'nome') {
            query += ' ORDER BY nome ASC';
        } else if (ordenar === 'data') {
            query += ' ORDER BY data_cadastro DESC';
        } else if (ordenar === 'conformidade') {
            query += ' ORDER BY media_conformidade DESC NULLS LAST';
        } else {
            query += ' ORDER BY data_cadastro DESC';
        }

        const result = await db.query(query, params);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao listar batedores:', error);
        res.status(500).json({ error: 'Erro ao listar batedores' });
    }
});

// GET - Detalhes completos de um batedor
router.get('/batedor/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Dados do batedor
        const batedor = await db.query('SELECT * FROM batedores WHERE id = $1', [id]);

        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Checklists
        const checklists = await db.query(
            'SELECT * FROM checklists WHERE batedor_id = $1 ORDER BY data_checklist DESC',
            [id]
        );

        // Análises
        const analises = await db.query(`
            SELECT a.*, u.nome as gestor_nome
            FROM analises a
            LEFT JOIN usuarios u ON a.gestor_id = u.id
            WHERE a.batedor_id = $1
            ORDER BY a.data_analise DESC
        `, [id]);

        // Selos
        const selos = await db.query(
            'SELECT * FROM selos WHERE batedor_id = $1 ORDER BY data_emissao DESC',
            [id]
        );

        // Requisitos de selos
        const requisitos = await db.query(
            'SELECT * FROM requisitos_selos WHERE batedor_id = $1',
            [id]
        );

        // Cálculos de cloração
        const calculos = await db.query(
            'SELECT * FROM calculos_cloracao WHERE batedor_id = $1 ORDER BY data_calculo DESC LIMIT 20',
            [id]
        );

        res.json({
            success: true,
            data: {
                batedor: batedor.rows[0],
                checklists: checklists.rows,
                analises: analises.rows,
                selos: selos.rows,
                requisitos: requisitos.rows,
                calculos: calculos.rows
            }
        });
    } catch (error) {
        console.error('Erro ao buscar detalhes do batedor:', error);
        res.status(500).json({ error: 'Erro ao buscar detalhes' });
    }
});

// ==================== ROTAS DE ANÁLISE ====================

// POST - Criar nova análise
router.post('/analise', async (req, res) => {
    try {
        const {
            batedorId,
            tipoAnalise,
            resultado,
            pontuacao,
            pontosCriticos,
            pontosPositivos,
            laudo,
            prazoCorrecao,
            anexos
        } = req.body;

        if (!batedorId || !tipoAnalise || !resultado || !laudo) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        // Iniciar transação
        await db.query('BEGIN');

        // Criar análise
        const analise = await db.query(`
            INSERT INTO analises (batedor_id, gestor_id, tipo_analise, resultado, pontuacao, 
                                 pontos_criticos, pontos_positivos, laudo, prazo_correcao, anexos)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [
            batedorId,
            req.usuario.id,
            tipoAnalise,
            resultado,
            pontuacao || null,
            pontosCriticos || [],
            pontosPositivos || [],
            laudo,
            prazoCorrecao || null,
            JSON.stringify(anexos || [])
        ]);

        // Atualizar status do batedor
        let novoStatus = 'em_analise';
        if (resultado === 'aprovado') {
            novoStatus = 'aprovado';
        } else if (resultado === 'reprovado') {
            novoStatus = 'reprovado';
        }

        await db.query(`
            UPDATE batedores 
            SET status_aprovacao = $1, 
                data_aprovacao = CURRENT_TIMESTAMP,
                gestor_responsavel_id = $2
            WHERE id = $3
        `, [novoStatus, req.usuario.id, batedorId]);

        // Criar notificação para o batedor
        const batedor = await db.query('SELECT usuario_id FROM batedores WHERE id = $1', [batedorId]);
        if (batedor.rows[0] && batedor.rows[0].usuario_id) {
            let tituloNotif = '';
            let mensagemNotif = '';

            if (resultado === 'aprovado') {
                tituloNotif = '✅ Estabelecimento Aprovado!';
                mensagemNotif = 'Parabéns! Seu estabelecimento foi aprovado pela autoridade sanitária.';
            } else if (resultado === 'reprovado') {
                tituloNotif = '❌ Estabelecimento Reprovado';
                mensagemNotif = 'Seu estabelecimento foi reprovado. Verifique o laudo para mais detalhes.';
            } else {
                tituloNotif = '⚠️ Pendências Identificadas';
                mensagemNotif = 'Foram identificadas pendências que precisam ser corrigidas.';
            }

            await db.query(`
                INSERT INTO notificacoes (batedor_id, usuario_id, tipo, titulo, mensagem)
                VALUES ($1, $2, $3, $4, $5)
            `, [batedorId, batedor.rows[0].usuario_id, resultado, tituloNotif, mensagemNotif]);
        }

        // Registrar no histórico
        await db.query(`
            INSERT INTO historico_gestor (gestor_id, batedor_id, acao, detalhes)
            VALUES ($1, $2, $3, $4)
        `, [
            req.usuario.id,
            batedorId,
            'analise_criada',
            JSON.stringify({ tipo: tipoAnalise, resultado, pontuacao })
        ]);

        await db.query('COMMIT');

        res.json({ success: true, data: analise.rows[0] });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erro ao criar análise:', error);
        res.status(500).json({ error: 'Erro ao criar análise' });
    }
});

// PUT - Atualizar análise existente
router.put('/analise/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            resultado,
            pontuacao,
            pontosCriticos,
            pontosPositivos,
            laudo,
            prazoCorrecao,
            anexos
        } = req.body;

        const result = await db.query(`
            UPDATE analises 
            SET resultado = $1, pontuacao = $2, pontos_criticos = $3, 
                pontos_positivos = $4, laudo = $5, prazo_correcao = $6, anexos = $7,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [
            resultado,
            pontuacao || null,
            pontosCriticos || [],
            pontosPositivos || [],
            laudo,
            prazoCorrecao || null,
            JSON.stringify(anexos || []),
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Análise não encontrada' });
        }

        // Registrar no histórico
        await db.query(`
            INSERT INTO historico_gestor (gestor_id, batedor_id, acao, detalhes)
            VALUES ($1, $2, $3, $4)
        `, [
            req.usuario.id,
            result.rows[0].batedor_id,
            'analise_atualizada',
            JSON.stringify({ analise_id: id, resultado })
        ]);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar análise:', error);
        res.status(500).json({ error: 'Erro ao atualizar análise' });
    }
});

// ==================== ROTAS DE CHECKLIST (EDIÇÃO) ====================

// PUT - Editar checklist existente
router.put('/checklist/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            higiene,
            ambiente,
            pragas,
            agua,
            equipamentos,
            observacoes,
            observacoesGestor,
            itensConformes,
            totalItens,
            percentualConformidade,
            conforme
        } = req.body;

        const result = await db.query(`
            UPDATE checklists 
            SET higiene_manipulador = $1, limpeza_ambiente = $2, controle_pragas = $3,
                qualidade_agua = $4, manutencao_equipamentos = $5, observacoes = $6,
                observacoes_gestor = $7, itens_conformes = $8, total_itens = $9,
                percentual_conformidade = $10, conforme = $11,
                gestor_id = $12, data_edicao_gestor = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING *
        `, [
            JSON.stringify(higiene),
            JSON.stringify(ambiente),
            JSON.stringify(pragas),
            JSON.stringify(agua),
            JSON.stringify(equipamentos),
            observacoes,
            observacoesGestor || null,
            itensConformes,
            totalItens,
            percentualConformidade,
            conforme,
            req.usuario.id,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Checklist não encontrado' });
        }

        // Registrar no histórico
        await db.query(`
            INSERT INTO historico_gestor (gestor_id, batedor_id, acao, detalhes)
            VALUES ($1, $2, $3, $4)
        `, [
            req.usuario.id,
            result.rows[0].batedor_id,
            'checklist_editado',
            JSON.stringify({ checklist_id: id, percentual: percentualConformidade })
        ]);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao editar checklist:', error);
        res.status(500).json({ error: 'Erro ao editar checklist' });
    }
});

// ==================== ROTAS DE STATUS E APROVAÇÃO ====================

// PUT - Atualizar status de aprovação de um batedor
router.put('/batedor/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, motivoReprovacao } = req.body;

        if (!['pendente', 'aprovado', 'reprovado', 'em_analise'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        await db.query('BEGIN');

        const result = await db.query(`
            UPDATE batedores 
            SET status_aprovacao = $1,
                data_aprovacao = CURRENT_TIMESTAMP,
                gestor_responsavel_id = $2
            WHERE id = $3
            RETURNING *
        `, [status, req.usuario.id, id]);

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Criar notificação
        const batedor = await db.query('SELECT usuario_id FROM batedores WHERE id = $1', [id]);
        if (batedor.rows[0] && batedor.rows[0].usuario_id) {
            let titulo = '';
            let mensagem = '';

            if (status === 'aprovado') {
                titulo = '✅ Status Atualizado: Aprovado';
                mensagem = 'Seu estabelecimento foi aprovado pela autoridade sanitária.';
            } else if (status === 'reprovado') {
                titulo = '❌ Status Atualizado: Reprovado';
                mensagem = motivoReprovacao || 'Seu estabelecimento foi reprovado. Entre em contato para mais informações.';
            } else if (status === 'em_analise') {
                titulo = '🔍 Status Atualizado: Em Análise';
                mensagem = 'Seu estabelecimento está sendo analisado pela autoridade sanitária.';
            }

            await db.query(`
                INSERT INTO notificacoes (batedor_id, usuario_id, tipo, titulo, mensagem)
                VALUES ($1, $2, $3, $4, $5)
            `, [id, batedor.rows[0].usuario_id, 'status_alterado', titulo, mensagem]);
        }

        // Registrar no histórico
        await db.query(`
            INSERT INTO historico_gestor (gestor_id, batedor_id, acao, detalhes)
            VALUES ($1, $2, $3, $4)
        `, [
            req.usuario.id,
            id,
            'status_alterado',
            JSON.stringify({ novo_status: status, motivo: motivoReprovacao })
        ]);

        await db.query('COMMIT');

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// ==================== ROTAS DE HISTÓRICO ====================

// GET - Histórico de ações do gestor
router.get('/historico', async (req, res) => {
    try {
        const { gestorId, batedorId, limite } = req.query;

        let query = `
            SELECT h.*, u.nome as gestor_nome, b.nome_fantasia
            FROM historico_gestor h
            LEFT JOIN usuarios u ON h.gestor_id = u.id
            LEFT JOIN batedores b ON h.batedor_id = b.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (gestorId) {
            query += ` AND h.gestor_id = $${paramIndex}`;
            params.push(gestorId);
            paramIndex++;
        }

        if (batedorId) {
            query += ` AND h.batedor_id = $${paramIndex}`;
            params.push(batedorId);
            paramIndex++;
        }

        query += ' ORDER BY h.data_acao DESC';

        if (limite) {
            query += ` LIMIT $${paramIndex}`;
            params.push(parseInt(limite));
        } else {
            query += ' LIMIT 100';
        }

        const result = await db.query(query, params);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// ==================== ROTAS DE NOTIFICAÇÕES ====================

// GET - Buscar notificações de um batedor/usuário
router.get('/notificacoes/:usuarioId', async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { apenasNaoLidas } = req.query;

        let query = `
            SELECT n.*, b.nome_fantasia
            FROM notificacoes n
            LEFT JOIN batedores b ON n.batedor_id = b.id
            WHERE n.usuario_id = $1
        `;

        if (apenasNaoLidas === 'true') {
            query += ' AND n.lida = FALSE';
        }

        query += ' ORDER BY n.criada_em DESC LIMIT 50';

        const result = await db.query(query, [usuarioId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
});

// PUT - Marcar notificação como lida
router.put('/notificacao/:id/lida', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'UPDATE notificacoes SET lida = TRUE WHERE id = $1 RETURNING *',
            [id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao marcar notificação:', error);
        res.status(500).json({ error: 'Erro ao marcar notificação' });
    }
});

// ==================== ROTAS DE RELATÓRIOS ====================

// GET - Relatório geral de conformidade
router.get('/relatorio/conformidade', async (req, res) => {
    try {
        const { dataInicio, dataFim } = req.query;

        let query = `
            SELECT 
                b.nome_fantasia,
                b.status_aprovacao,
                COUNT(c.id) as total_checklists,
                AVG(c.percentual_conformidade) as media_conformidade,
                COUNT(CASE WHEN c.conforme THEN 1 END) as checklists_conformes
            FROM batedores b
            LEFT JOIN checklists c ON b.id = c.batedor_id
        `;

        const params = [];
        if (dataInicio && dataFim) {
            query += ` WHERE c.data_checklist BETWEEN $1 AND $2`;
            params.push(dataInicio, dataFim);
        }

        query += ` GROUP BY b.id, b.nome_fantasia, b.status_aprovacao ORDER BY media_conformidade DESC`;

        const result = await db.query(query, params);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
});

module.exports = router;
