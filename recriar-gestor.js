// Recriar usuário gestor com hash correto
const { Pool } = require('./server/node_modules/pg');
const bcrypt = require('./server/node_modules/bcryptjs');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function recriarGestor() {
    try {
        console.log('\n🔧 Recriando usuário gestor...\n');
        
        // Deletar gestor existente
        await pool.query("DELETE FROM usuarios WHERE email = 'gestor@acaiseguro.com'");
        console.log(' Gestor antigo removido');
        
        // Criar hash da senha
        const senhaHash = await bcrypt.hash('gestor123', 10);
        console.log('✅ Hash gerado:', senhaHash.substring(0, 20) + '...');
        
        // Criar novo gestor
        const result = await pool.query(
            "INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, role",
            ['Gestor Padrão', 'gestor@acaiseguro.com', senhaHash, 'gestor']
        );
        
        console.log('\n✅ GESTOR CRIADO COM SUCESSO!\n');
        console.log('  ID:', result.rows[0].id);
        console.log('  Nome:', result.rows[0].nome);
        console.log('  Email:', result.rows[0].email);
        console.log('  Role:', result.rows[0].role);
        console.log('\n  🔐 Senha: gestor123\n');
        
        // Testar se o hash funciona
        const senhaCorreta = await bcrypt.compare('gestor123', senhaHash);
        console.log('✅ Teste de senha:', senhaCorreta ? 'OK' : 'FALHOU');
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

recriarGestor();
