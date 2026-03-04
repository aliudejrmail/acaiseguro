@echo off
echo ========================================
echo   INSTALACAO ACAI SEGURO
echo ========================================
echo.

echo [1/3] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js primeiro: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js encontrado!

echo.
echo [2/3] Instalando dependencias do servidor...
cd server
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Criando arquivo .env...
if not exist server\.env (
    copy server\.env.example server\.env
    echo Arquivo .env criado!
) else (
    echo Arquivo .env ja existe.
)

echo.
echo ========================================
echo   INSTALACAO CONCLUIDA COM SUCESSO!
echo ========================================
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. CONFIGURE O BANCO DE DADOS:
echo    - Abra o pgAdmin ou outro cliente PostgreSQL
echo    - Execute o arquivo: sql\schema.sql
echo    - Ou use o comando no pgAdmin: Tools ^> Query Tool
echo.
echo 2. CONFIGURE AS CREDENCIAIS:
echo    - Edite o arquivo: server\.env
echo    - Altere DB_PASSWORD=sua_senha_aqui
echo.
echo 3. INICIE O SERVIDOR:
echo    - Execute: start-server.bat
echo.
echo 4. ABRA O APLICATIVO:
echo    - Abra o arquivo: index.html no navegador
echo.
echo Consulte SETUP.md para instrucoes detalhadas!
echo.
pause
