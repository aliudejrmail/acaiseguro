@echo off
chcp 65001 >nul
echo.
echo ════════════════════════════════════════════════════════════
echo    🔧 APLICAR ALTERAÇÕES DO SISTEMA DE GESTOR
echo ════════════════════════════════════════════════════════════
echo.

REM Definir variáveis de conexão
set PGHOST=localhost
set PGPORT=5432
set PGDATABASE=acaiseguro
set PGUSER=postgres

echo 📊 Aplicando schema do sistema de gestor...
echo.

REM Aplicar schema
psql -h %PGHOST% -p %PGPORT% -U %PGUSER% -d %PGDATABASE% -f sql\gestor_schema.sql

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erro ao aplicar as alterações!
    echo.
    pause
    exit /b 1
)

echo.
echo ════════════════════════════════════════════════════════════
echo    ✅ ALTERAÇÕES APLICADAS COM SUCESSO!
echo ════════════════════════════════════════════════════════════
echo.
echo 📋 Resumo das alterações:
echo    • Campo 'role' adicionado à tabela usuarios
echo    • Campos de aprovação adicionados à tabela batedores
echo    • Tabela 'analises' criada para laudos
echo    • Tabela 'historico_gestor' criada para auditoria
echo    • Tabela 'notificacoes' criada para alertas
echo    • Views de dashboard criadas
echo    • Gestor padrão criado (gestor@acaiseguro.com / gestor123)
echo.
echo 🎯 Como usar:
echo    1. Acesse http://localhost:3000
echo    2. Selecione "Gestor / Autoridade Sanitária"
echo    3. Login: gestor@acaiseguro.com
echo    4. Senha: gestor123
echo.
pause
