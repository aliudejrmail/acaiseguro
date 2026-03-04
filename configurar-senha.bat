@echo off
echo ========================================
echo   CONFIGURAR SENHA DO POSTGRESQL
echo ========================================
echo.
echo Este script vai ajudar voce a configurar
echo a senha do PostgreSQL no arquivo .env
echo.
pause

:INPUT
echo.
set /p DB_PASSWORD="Digite a senha do PostgreSQL: "

if "%DB_PASSWORD%"=="" (
    echo Senha nao pode ser vazia!
    goto INPUT
)

echo.
echo Configurando arquivo .env...

cd server

REM Criar backup do .env
copy .env .env.backup >nul 2>&1

REM Substituir a senha
powershell -Command "(Get-Content .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=%DB_PASSWORD%' | Set-Content .env"

if errorlevel 1 (
    echo ERRO ao configurar arquivo!
    if exist .env.backup (
        echo Restaurando backup...
        copy .env.backup .env >nul
    )
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo   SENHA CONFIGURADA COM SUCESSO!
echo ========================================
echo.
echo Arquivo configurado: server\.env
echo Backup criado: server\.env.backup
echo.
echo PROXIMOS PASSOS:
echo 1. Configure o banco de dados (pgAdmin ou setup-database.bat)
echo 2. Execute: start-server.bat
echo 3. Abra: index.html
echo.
pause
