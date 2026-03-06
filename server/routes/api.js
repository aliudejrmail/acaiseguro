const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { gerarToken, verificarToken } = require('../config/auth');
const { autenticar } = require('../middleware/authMiddleware');

// ==================== ROTAS DE USUÁRIOS (AUTH) ====================

// POST - Cadastro de novo usuário
router.post('/usuario/cadastro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
        }
        // Verificar se email já existe
        const existente = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existente.rows.length > 0) {
            return res.status(409).json({ error: 'E-mail já cadastrado.' });
        }
        const hash = await bcrypt.hash(senha, 10);
        const result = await db.query(
            'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em',
            [nome, email, hash]
        );
        const token = gerarToken(result.rows[0]);
        res.status(201).json({ success: true, data: result.rows[0], token });
    } catch (error) {
        console.error('Erro ao cadastrar usuário:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário.' });
    }
});

// POST - Login de usuário
router.post('/usuario/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        if (!email || !senha) {
            return res.status(400).json({ error: 'Preencha e-mail e senha.' });
        }
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }
        const usuario = result.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
        }
        const token = gerarToken(usuario);
        res.json({
            success: true,
            data: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                role: usuario.role || 'batedor'
            },
            token
        });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

// O middleware global para as rotas abaixo
router.use(autenticar);

// GET - Buscar cadastro do batedor pelo usuario_id (apenas o próprio usuário)
router.get('/meu-cadastro/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;

        // Segurança: verificar se o usuário está pedindo seu próprio cadastro
        if (req.usuario.id != usuario_id && req.usuario.role !== 'gestor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const result = await db.query(
            'SELECT * FROM batedores WHERE usuario_id = $1 LIMIT 1',
            [usuario_id]
        );
        if (result.rows.length === 0) {
            return res.json({ success: true, data: null });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao buscar cadastro por usuario_id:', error);
        res.status(500).json({ error: 'Erro ao buscar cadastro.' });
    }
});

// ==================== ROTAS DE BATEDORES (CADASTRO) ====================

// GET - Buscar batedor por CPF
router.get('/batedor/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;
        const result = await db.query(
            'SELECT * FROM batedores WHERE cpf = $1',
            [cpf]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Segurança: apenas o próprio batedor ou gestor
        if (result.rows[0].usuario_id != req.usuario.id && req.usuario.role !== 'gestor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao buscar batedor:', error);
        res.status(500).json({ error: 'Erro ao buscar batedor' });
    }
});

// POST - Criar ou atualizar batedor
router.post('/batedor', async (req, res) => {
    try {
        const {
            nome,
            cpf,
            telefone,
            nomeFantasia,
            cnpj,
            endereco,
            alvara,
            alvaraFoto,
            latitude,
            longitude
        } = req.body;

        // Validação básica
        if (!nome || !cpf || !telefone || !nomeFantasia || !endereco) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        // Lógica de status automático
        let statusUpdate = '';
        if (alvara && alvaraFoto) {
            // Se preencheu alvará agora, colocar em análise para o gestor validar
            statusUpdate = ", status_aprovacao = 'em_analise'";
        }

        let result;
        if (existente.rows.length > 0) {
            // Atualizar
            result = await db.query(
                `UPDATE batedores 
                SET nome = $1, telefone = $2, nome_fantasia = $3, cnpj = $4, 
                    endereco = $5, alvara = $6, alvara_foto = $7, latitude = $8, longitude = $9,
                    usuario_id = COALESCE(usuario_id, $11),
                    data_atualizacao = CURRENT_TIMESTAMP
                    ${statusUpdate}
                WHERE cpf = $10
                RETURNING *`,
                [nome, telefone, nomeFantasia, cnpj, endereco, alvara, alvaraFoto, latitude, longitude, cpf, req.body.usuarioId || null]
            );
        } else {
            // Criar novo
            const status = (alvara && alvaraFoto) ? 'em_analise' : 'pendente';
            result = await db.query(
                `INSERT INTO batedores (nome, cpf, telefone, nome_fantasia, cnpj, endereco, alvara, alvara_foto, latitude, longitude, usuario_id, status_aprovacao)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                RETURNING *`,
                [nome, cpf, telefone, nomeFantasia, cnpj, endereco, alvara, alvaraFoto, latitude, longitude, req.body.usuarioId || null, status]
            );
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao salvar batedor:', error);
        res.status(500).json({ error: 'Erro ao salvar batedor' });
    }
});

// ==================== ROTAS DE CHECK-LISTS ====================

// GET - Buscar check-lists de um batedor
router.get('/checklists/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;
        const { dias } = req.query; // Filtro opcional por dias

        // Buscar batedor_id e usuario_id para segurança
        const batedor = await db.query('SELECT id, usuario_id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Segurança: apenas o próprio ou gestor
        if (batedor.rows[0].usuario_id != req.usuario.id && req.usuario.role !== 'gestor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const batedorId = batedor.rows[0].id;

        // Verificar se já preencheu hoje
        const hoje = await db.query(
            `SELECT id FROM checklists 
             WHERE batedor_id = $1 
             AND DATE(data_checklist) = CURRENT_DATE`,
            [batedorId]
        );

        let query = `
            SELECT * FROM checklists 
            WHERE batedor_id = $1
        `;
        let params = [batedorId];

        if (dias) {
            query += ` AND data_checklist >= CURRENT_TIMESTAMP - INTERVAL '${parseInt(dias)} days'`;
        }

        query += ' ORDER BY data_checklist DESC';

        const result = await db.query(query, params);
        res.json({
            success: true,
            data: result.rows,
            preenchidoHoje: hoje.rows.length > 0
        });
    } catch (error) {
        console.error('Erro ao buscar checklists:', error);
        res.status(500).json({ error: 'Erro ao buscar checklists' });
    }
});

// POST - Salvar check-list
router.post('/checklist', async (req, res) => {
    try {
        const {
            cpf,
            higiene,
            ambiente,
            pragas,
            agua,
            equipamentos,
            observacoes,
            itensConformes,
            totalItens,
            percentualConformidade,
            conforme
        } = req.body;

        // Buscar batedor_id
        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        const batedorId = batedor.rows[0].id;

        // VALIDAÇÃO: verificar se já existe check-list hoje
        const hoje = await db.query(
            `SELECT id FROM checklists 
             WHERE batedor_id = $1 
             AND DATE(data_checklist) = CURRENT_DATE`,
            [batedorId]
        );

        if (hoje.rows.length > 0) {
            return res.status(400).json({
                error: 'Já existe um check-list registrado hoje. Você pode preencher um novo check-list amanhã.',
                codigo: 'CHECKLIST_DIARIO_JA_PREENCHIDO'
            });
        }

        const result = await db.query(
            `INSERT INTO checklists 
            (batedor_id, data_checklist, higiene_manipulador, limpeza_ambiente, 
             controle_pragas, qualidade_agua, manutencao_equipamentos, observacoes,
             itens_conformes, total_itens, percentual_conformidade, conforme)
            VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [batedorId, JSON.stringify(higiene), JSON.stringify(ambiente),
                JSON.stringify(pragas), JSON.stringify(agua), JSON.stringify(equipamentos),
                observacoes, itensConformes, totalItens, percentualConformidade, conforme]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao salvar checklist:', error);
        res.status(500).json({ error: 'Erro ao salvar checklist' });
    }
});

// ==================== ROTAS DE CÁLCULOS DE CLORAÇÃO ====================

// GET - Buscar cálculos de um batedor
router.get('/calculos/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;

        const batedor = await db.query('SELECT id, usuario_id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Segurança
        if (batedor.rows[0].usuario_id != req.usuario.id && req.usuario.role !== 'gestor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const batedorId = batedor.rows[0].id;

        const result = await db.query(
            'SELECT * FROM calculos_cloracao WHERE batedor_id = $1 ORDER BY data_calculo DESC LIMIT 50',
            [batedorId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao buscar cálculos:', error);
        res.status(500).json({ error: 'Erro ao buscar cálculos' });
    }
});

// POST - Salvar cálculo
router.post('/calculo', async (req, res) => {
    try {
        const { cpf, quantidadeAgua, concentracaoCloro, resultado } = req.body;

        const batedor = await db.query('SELECT id, usuario_id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Segurança
        if (batedor.rows[0].usuario_id != req.usuario.id) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const batedorId = batedor.rows[0].id;

        const result = await db.query(
            `INSERT INTO calculos_cloracao (batedor_id, quantidade_agua, concentracao_cloro, resultado_ml)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [batedorId, quantidadeAgua, concentracaoCloro, resultado]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao salvar cálculo:', error);
        res.status(500).json({ error: 'Erro ao salvar cálculo' });
    }
});

// ==================== ROTAS DE SELOS ====================

// GET - Buscar selo ativo de um batedor
router.get('/selo/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;

        const batedor = await db.query('SELECT id, usuario_id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Segurança
        if (batedor.rows[0].usuario_id != req.usuario.id && req.usuario.role !== 'gestor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const batedorId = batedor.rows[0].id;

        const result = await db.query(
            `SELECT * FROM selos 
            WHERE batedor_id = $1 AND ativo = TRUE AND data_validade > CURRENT_TIMESTAMP
            ORDER BY data_emissao DESC LIMIT 1`,
            [batedorId]
        );

        if (result.rows.length === 0) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao buscar selo:', error);
        res.status(500).json({ error: 'Erro ao buscar selo' });
    }
});

// POST - Emitir selo
router.post('/selo', async (req, res) => {
    try {
        const { cpf, tipo } = req.body;

        if (!['prata', 'ouro'].includes(tipo)) {
            return res.status(400).json({ error: 'Tipo de selo inválido' });
        }

        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        const batedorId = batedor.rows[0].id;

        // Desativar selos anteriores
        await db.query('UPDATE selos SET ativo = FALSE WHERE batedor_id = $1', [batedorId]);

        // Criar novo selo (válido por 1 ano)
        const result = await db.query(
            `INSERT INTO selos (batedor_id, tipo, data_emissao, data_validade)
            VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year')
            RETURNING *`,
            [batedorId, tipo]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao emitir selo:', error);
        res.status(500).json({ error: 'Erro ao emitir selo' });
    }
});

// ==================== ROTAS DE REQUISITOS DE SELOS ====================

// GET - Buscar requisitos de um batedor
router.get('/requisitos/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;

        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        const batedorId = batedor.rows[0].id;

        const result = await db.query(
            'SELECT * FROM requisitos_selos WHERE batedor_id = $1',
            [batedorId]
        );

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Erro ao buscar requisitos:', error);
        res.status(500).json({ error: 'Erro ao buscar requisitos' });
    }
});

// POST - Atualizar status de requisito
router.post('/requisito', async (req, res) => {
    try {
        const { cpf, tipoSelo, numeroRequisito, status } = req.body;

        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        const batedorId = batedor.rows[0].id;

        const result = await db.query(
            `INSERT INTO requisitos_selos (batedor_id, tipo_selo, numero_requisito, status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (batedor_id, tipo_selo, numero_requisito)
            DO UPDATE SET status = $4, data_atualizacao = CURRENT_TIMESTAMP
            RETURNING *`,
            [batedorId, tipoSelo, numeroRequisito, status]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Erro ao atualizar requisito:', error);
        res.status(500).json({ error: 'Erro ao atualizar requisito' });
    }
});

// ==================== ROTAS DE ESTATÍSTICAS ====================

// GET - Estatísticas gerais de um batedor
router.get('/estatisticas/:cpf', async (req, res) => {
    try {
        const { cpf } = req.params;

        const batedor = await db.query('SELECT id, usuario_id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
        }

        // Segurança
        if (batedor.rows[0].usuario_id != req.usuario.id && req.usuario.role !== 'gestor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const batedorId = batedor.rows[0].id;

        // Total de checklists
        const totalChecklists = await db.query(
            'SELECT COUNT(*) FROM checklists WHERE batedor_id = $1',
            [batedorId]
        );

        // Média de conformidade
        const mediaConformidade = await db.query(
            'SELECT AVG(percentual_conformidade) as media FROM checklists WHERE batedor_id = $1',
            [batedorId]
        );

        // Checklists últimos 30 dias
        const checklists30dias = await db.query(
            `SELECT COUNT(*) FROM checklists
            WHERE batedor_id = $1 AND data_checklist >= CURRENT_TIMESTAMP - INTERVAL '30 days'`,
            [batedorId]
        );

        res.json({
            success: true,
            data: {
                totalChecklists: parseInt(totalChecklists.rows[0].count),
                mediaConformidade: parseFloat(mediaConformidade.rows[0].media || 0).toFixed(2),
                checklists30dias: parseInt(checklists30dias.rows[0].count)
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// ==================== ROTAS LGPD - DIREITOS DO TITULAR ====================

// GET - Exportar todos os dados do usuário (Direito à Portabilidade - Art. 18, V)
router.get('/meus-dados/exportar', async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        // Buscar dados do usuário
        const usuario = await db.query(
            'SELECT id, nome, email, role, criado_em FROM usuarios WHERE id = $1',
            [usuarioId]
        );

        // Buscar cadastro do batedor
        const batedor = await db.query(
            'SELECT * FROM batedores WHERE usuario_id = $1',
            [usuarioId]
        );

        let checklists = { rows: [] };
        let calculos = { rows: [] };
        let selos = { rows: [] };
        let notificacoes = { rows: [] };
        let analises = { rows: [] };

        if (batedor.rows.length > 0) {
            const batedorId = batedor.rows[0].id;

            // Buscar checklists
            checklists = await db.query(
                'SELECT * FROM checklists WHERE batedor_id = $1 ORDER BY data_checklist DESC',
                [batedorId]
            );

            // Buscar cálculos de cloração
            calculos = await db.query(
                'SELECT * FROM calculos_cloracao WHERE batedor_id = $1 ORDER BY data_calculo DESC',
                [batedorId]
            );

            // Buscar selos
            selos = await db.query(
                'SELECT * FROM selos WHERE batedor_id = $1 ORDER BY data_validade DESC',
                [batedorId]
            );

            // Buscar análises
            analises = await db.query(
                'SELECT * FROM analises WHERE batedor_id = $1 ORDER BY data_analise DESC',
                [batedorId]
            );
        }

        // Buscar notificações
        notificacoes = await db.query(
            'SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY criada_em DESC',
            [usuarioId]
        );

        // Criar objeto JSON estruturado para exportação
        const exportData = {
            data_exportacao: new Date().toISOString(),
            versao_lgpd: '1.0',
            titular: {
                usuario: usuario.rows[0] || null,
                batedor: batedor.rows[0] || null
            },
            dados_coletados: {
                checklists: checklists.rows,
                calculos_cloracao: calculos.rows,
                selos: selos.rows,
                analises: analises.rows,
                notificacoes: notificacoes.rows
            }
        };

        res.json({
            success: true,
            message: 'Dados exportados com sucesso',
            data: exportData
        });
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao exportar dados. Tente novamente.' 
        });
    }
});

// DELETE - Solicitar exclusão de dados (Direito ao Esquecimento - Art. 18, VI)
router.delete('/meus-dados/excluir', async (req, res) => {
    const client = await db.connect();
    
    try {
        const usuarioId = req.usuario.id;

        // Iniciar transação
        await client.query('BEGIN');

        // Buscar batedor_id se existir
        const batedorResult = await client.query(
            'SELECT id FROM batedores WHERE usuario_id = $1',
            [usuarioId]
        );

        if (batedorResult.rows.length > 0) {
            const batedorId = batedorResult.rows[0].id;

            // Excluir dados relacionados em ordem de dependência
            await client.query('DELETE FROM notificacoes WHERE batedor_id = $1', [batedorId]);
            await client.query('DELETE FROM requisitos_selos WHERE batedor_id = $1', [batedorId]);
            await client.query('DELETE FROM selos WHERE batedor_id = $1', [batedorId]);
            await client.query('DELETE FROM analises WHERE batedor_id = $1', [batedorId]);
            await client.query('DELETE FROM checklists WHERE batedor_id = $1', [batedorId]);
            await client.query('DELETE FROM calculos_cloracao WHERE batedor_id = $1', [batedorId]);
            await client.query('DELETE FROM historico_gestor WHERE batedor_id = $1', [batedorId]);
            await client.query('DELETE FROM batedores WHERE id = $1', [batedorId]);
        }

        // Excluir notificações do usuário
        await client.query('DELETE FROM notificacoes WHERE usuario_id = $1', [usuarioId]);

        // Excluir usuário
        await client.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Dados excluídos com sucesso. Sua conta será encerrada.'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao excluir dados:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro ao excluir dados. Tente novamente.' 
        });
    } finally {
        client.release();
    }
});

// GET - Log de acessos aos dados do usuário (Art. 18, IV)
router.get('/meus-dados/acessos', async (req, res) => {
    try {
        const usuarioId = req.usuario.id;

        const acessos = await db.query(`
            SELECT h.data_acao, h.acao, h.detalhes, u.nome as gestor_nome
            FROM historico_gestor h
            INNER JOIN batedores b ON h.batedor_id = b.id
            LEFT JOIN usuarios u ON h.gestor_id = u.id
            WHERE b.usuario_id = $1
            ORDER BY h.data_acao DESC
            LIMIT 100
        `, [usuarioId]);

        res.json({
            success: true,
            data: acessos.rows
        });
    } catch (error) {
        console.error('Erro ao buscar acessos:', error);
        res.status(500).json({ error: 'Erro ao buscar log de acessos' });
    }
});

module.exports = router;
