// Script para verificar usuários no banco
const { Pool } = require('./server/node_modules/pg');
require('./server/node_modules/dotenv').config({ path: './server/.env' });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

async function verificarUsuarios() {
    try {
        console.log('\n📊 Verificando usuários no banco...\n');
        
        const result = await pool.query('SELECT id, nome, email, role FROM usuarios');
        
        if (result.rows.length === 0) {
            console.log('❌ Nenhum usuário encontrado no banco!');
        } else {
            console.log('✅ Usuários encontrados:\n');
            result.rows.forEach(user => {
                console.log(`  ID: ${user.id}`);
                console.log(`  Nome: ${user.nome}`);
                console.log(`  Email: ${user.email}`);
                console.log(`  Role: ${user.role || 'batedor (padrão)'}`);
                console.log('  ---');
            });
        }
        
        // Verificar especificamente o gestor
        const gestor = await pool.query("SELECT * FROM usuarios WHERE email = 'gestor@acaiseguro.com'");
        
        if (gestor.rows.length === 0) {
            console.log('\n❌ Usuário gestor NÃO encontrado!');
            console.log('🔧 Criando usuário gestor...\n');
            
            // Hash da senha 'gestor123' com bcrypt
            const bcrypt = require('./server/node_modules/bcryptjs');
            const senhaHash = await bcrypt.hash('gestor123', 10);
            
            await pool.query(
                "INSERT INTO usuarios (nome, email, senha, role) VALUES ($1, $2, $3, $4)",
                ['Gestor Padrão', 'gestor@acaiseguro.com', senhaHash, 'gestor']
            );
            
            console.log('✅ Usuário gestor criado com sucesso!');
            console.log('   Email: gestor@acaiseguro.com');
            console.log('   Senha: gestor123');
        } else {
            console.log('\n✅ Usuário gestor encontrado:');
            console.log(`   ID: ${gestor.rows[0].id}`);
            console.log(`   Nome: ${gestor.rows[0].nome}`);
            console.log(`   Email: ${gestor.rows[0].email}`);
            console.log(`   Role: ${gestor.rows[0].role}`);
        }
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

verificarUsuarios();
