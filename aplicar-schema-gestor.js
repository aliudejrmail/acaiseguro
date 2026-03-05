// Script para aplicar schema do gestor diretamente
const { Pool } = require('./server/node_modules/pg');
require('./server/node_modules/dotenv').config({ path: './server/.env' });
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function aplicarSchema() {
    try {
        console.log('\n📊 Conectando ao banco de dados...');
        
        const sqlPath = path.join(__dirname, 'sql', 'gestor_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('✅ Arquivo SQL carregado');
        console.log('🔧 Aplicando alterações...\n');
        
        await pool.query(sql);
        
        console.log('\n✅ SCHEMA APLICADO COM SUCESSO!\n');
        console.log('════════════════════════════════════════════════════════════');
        console.log('   Credenciais do Gestor Criadas:');
        console.log('   Email: gestor@acaiseguro.com');
        console.log('   Senha: gestor123');
        console.log('════════════════════════════════════════════════════════════\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro ao aplicar schema:', error.message);
        console.error('\nDetalhes:', error);
        process.exit(1);
    }
}

aplicarSchema();
