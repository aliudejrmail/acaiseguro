const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'acaiseguro',
    max: 20, // Máximo de conexões no pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Teste de conexão
pool.on('connect', () => {
    console.log('✅ Conectado ao PostgreSQL');
});

pool.on('error', (err) => {
    console.error('❌ Erro inesperado no pool de conexões:', err);
    process.exit(-1);
});

// Função helper para executar queries
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query executada:', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Erro na query:', error);
        throw error;
    }
};

// Função helper para transações
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);
    
    // Adicionar timeout à transação
    const timeout = setTimeout(() => {
        console.error('Cliente de transação não foi liberado após 5 segundos');
    }, 5000);
    
    client.release = () => {
        clearTimeout(timeout);
        return release();
    };
    
    return client;
};

module.exports = {
    query,
    getClient,
    pool
};
