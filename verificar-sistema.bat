@echo off
echo ========================================
echo   VERIFICACAO DO SISTEMA ACAI SEGURO
echo ========================================
echo.

echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js NAO encontrado!
    echo     Instale em: https://nodejs.org/
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [OK] Node.js: %%i
)

echo.
echo [2/5] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm NAO encontrado!
) else (
    for /f "tokens=*" %%i in ('npm --version') do echo [OK] npm: %%i
)

echo.
echo [3/5] Verificando dependencias...
if exist "server\node_modules" (
    echo [OK] Dependencias instaladas
) else (
    echo [X] Dependencias NAO instaladas
    echo     Execute: cd server ^& npm install
)

echo.
echo [4/5] Verificando arquivo .env...
if exist "server\.env" (
    echo [OK] Arquivo .env existe
    findstr /C:"DB_PASSWORD=sua_senha_aqui" "server\.env" >nul
    if errorlevel 1 (
        echo [OK] Senha do banco configurada
    ) else (
        echo [!] ATENCAO: Configure a senha em server\.env
    )
) else (
    echo [X] Arquivo .env NAO encontrado
    echo     Copie server\.env.example para server\.env
)

echo.
echo [5/5] Verificando PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo [!] psql nao esta no PATH
    echo     Use o pgAdmin para configurar o banco
) else (
    for /f "tokens=*" %%i in ('psql --version') do echo [OK] PostgreSQL: %%i
)

echo.
echo ========================================
echo   RESUMO
echo ========================================
echo.

if exist "server\node_modules" (
    if exist "server\.env" (
        echo [OK] Sistema pronto para uso!
        echo.
        echo PROXIMOS PASSOS:
        echo 1. Configure a senha em server\.env
        echo 2. Configure o banco de dados (pgAdmin)
        echo 3. Execute: start-server.bat
        echo 4. Abra: index.html
    ) else (
        echo [!] Configure o arquivo .env primeiro
    )
) else (
    echo [X] Execute: cd server ^& npm install
)

echo.
pause
