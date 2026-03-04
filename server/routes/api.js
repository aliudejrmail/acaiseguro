const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');

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
        res.status(201).json({ success: true, data: result.rows[0] });
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
        res.json({ success: true, data: { id: usuario.id, nome: usuario.nome, email: usuario.email } });
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
});

// GET - Buscar cadastro do batedor pelo usuario_id
router.get('/meu-cadastro/:usuario_id', async (req, res) => {
    try {
        const { usuario_id } = req.params;
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
            latitude,
            longitude
        } = req.body;
        
        // Validação básica
        if (!nome || !cpf || !telefone || !nomeFantasia || !endereco || !alvara) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }
        
        // Verificar se já existe
        const existente = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        
        let result;
        if (existente.rows.length > 0) {
            // Atualizar
            result = await db.query(
                `UPDATE batedores 
                SET nome = $1, telefone = $2, nome_fantasia = $3, cnpj = $4, 
                    endereco = $5, alvara = $6, latitude = $7, longitude = $8,
                    usuario_id = COALESCE(usuario_id, $10),
                    data_atualizacao = CURRENT_TIMESTAMP
                WHERE cpf = $9
                RETURNING *`,
                [nome, telefone, nomeFantasia, cnpj, endereco, alvara, latitude, longitude, cpf, req.body.usuarioId || null]
            );
        } else {
            // Criar novo
            result = await db.query(
                `INSERT INTO batedores (nome, cpf, telefone, nome_fantasia, cnpj, endereco, alvara, latitude, longitude, usuario_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                RETURNING *`,
                [nome, cpf, telefone, nomeFantasia, cnpj, endereco, alvara, latitude, longitude, req.body.usuarioId || null]
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
        
        // Buscar batedor_id
        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
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
        
        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
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
        
        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
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
        
        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
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
        
        const batedor = await db.query('SELECT id FROM batedores WHERE cpf = $1', [cpf]);
        if (batedor.rows.length === 0) {
            return res.status(404).json({ error: 'Batedor não encontrado' });
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

module.exports = router;
