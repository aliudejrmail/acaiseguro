// Script para testar login

async function testarLogin() {
    try {
        console.log('\n🔐 Testando login do gestor...\n');
        
        const response = await fetch('http://localhost:3000/api/usuario/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'gestor@acaiseguro.com',
                senha: 'gestor123'
            })
        });
        
        const data = await response.json();
        
        console.log('Status:', response.status);
        console.log('Resposta:', JSON.stringify(data, null, 2));
        
        if (response.ok && data.success) {
            console.log('\n✅ LOGIN FUNCIONANDO!');
            console.log('   Role:', data.data.role);
        } else {
            console.log('\n❌ Erro no login');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro:', error.message);
        process.exit(1);
    }
}

setTimeout(() => testarLogin(), 2000); // Aguarda 2s para o servidor iniciar
