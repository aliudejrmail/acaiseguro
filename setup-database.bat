@echo off
echo ========================================
echo   SETUP BANCO DE DADOS ACAI SEGURO
echo ========================================
echo.
echo IMPORTANTE:
echo Este script requer que o PostgreSQL esteja instalado
echo e o comando 'psql' esteja disponivel no PATH.
echo.
echo Se voce receber erro "psql nao reconhecido",
echo use as instrucoes manuais abaixo:
echo.
echo ----------------------------------------
echo OPCAO 1: Adicionar PostgreSQL ao PATH
echo ----------------------------------------
echo 1. Localize a pasta bin do PostgreSQL
echo    Exemplo: C:\Program Files\PostgreSQL\16\bin
echo 2. Adicione ao PATH do sistema
echo 3. Reinicie o terminal e execute este script novamente
echo.
echo ----------------------------------------
echo OPCAO 2: Setup Manual (RECOMENDADO)
echo ----------------------------------------
echo 1. Abra o pgAdmin
echo 2. Conecte-se ao servidor PostgreSQL
echo 3. Clique com botao direito em 'Databases' ^> Create ^> Database
echo 4. Nome: acaiseguro
echo 5. Clique em 'Save'
echo 6. Clique no banco 'acaiseguro'
echo 7. Va em Tools ^> Query Tool
echo 8. Abra o arquivo: sql\schema.sql
echo 9. Execute (F5 ou icone play)
echo.
echo ----------------------------------------
echo Tentar executar automaticamente? (S/N)
echo ----------------------------------------
set /p CONTINUAR="Resposta: "

if /i not "%CONTINUAR%"=="S" (
    echo Setup cancelado. Use o metodo manual acima.
    pause
    exit /b 0
)

echo.
echo Tentando executar psql...
psql --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERRO: comando psql nao encontrado!
    echo Por favor, use o metodo manual descrito acima.
    echo.
    pause
    exit /b 1
)

echo.
set /p DB_PASSWORD="Digite a senha do PostgreSQL: "

echo.
echo Criando banco de dados...
set PGPASSWORD=%DB_PASSWORD%
psql -U postgres -c "CREATE DATABASE acaiseguro;" 2>nul
if errorlevel 1 (
    echo Banco pode ja existir, continuando...
)

echo Executando schema...
psql -U postgres -d acaiseguro -f sql\schema.sql
if errorlevel 1 (
    echo.
    echo ERRO ao executar schema!
    echo Use o metodo manual com pgAdmin.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Banco de dados configurado com sucesso!
echo ========================================
pause
