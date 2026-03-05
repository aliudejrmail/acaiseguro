const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const apiRoutes = require('./routes/api');
const gestorRoutes = require('./routes/gestor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Aumentar limite para fotos
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Log de requisições
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rota de health check
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../apresentacao.html'));
});

// Servir arquivos estáticos (css, js, imagens)
app.use(express.static(path.join(__dirname, '../')));

// Rotas da API
app.use('/api', apiRoutes);
app.use('/api/gestor', gestorRoutes);

// Rota 404
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Erro:', err.stack);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║                                       ║
    ║   🍇 API AÇAÍ SEGURO 🍇              ║
    ║                                       ║
    ║   Servidor rodando em:                ║
    ║   http://localhost:${PORT}              ║
    ║                                       ║
    ║   Ambiente: ${process.env.NODE_ENV || 'development'}           ║
    ║                                       ║
    ╚═══════════════════════════════════════╝
    `);
});

// Tratamento de encerramento gracioso
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando servidor...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT recebido. Encerrando servidor...');
    process.exit(0);
});
