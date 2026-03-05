@echo off
chcp 65001 > nul
echo ===================================================
echo     MIGRAR BANCO DE DADOS LOCAL PARA NEON
echo ===================================================
echo.

set PGPASSWORD=acaiseguro@2026
set PG_BIN="C:\Program Files\PostgreSQL\15\bin"

echo [1/3] Exportando dados do banco local (acaiseguro)...
%PG_BIN%\pg_dump.exe -U postgres -h localhost -p 5432 -d acaiseguro -F p -f dump.sql --clean --if-exists --no-owner --no-privileges

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao exportar banco de dados. Verifique sua senha e se o PostgreSQL local está rodando.
    pause
    exit /b
)
echo Sucesso na exportação!
echo.

echo [2/3] Importando dados para o banco Neon na nuvem...
echo Isso pode levar alguns minutos. Por favor, aguarde.

:: Pegando a URL do .env com senha
SET NEON_URL=postgresql://neondb_owner:npg_75wsURzhCSqM@ep-divine-base-acq8v2ku-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require

%PG_BIN%\psql.exe "%NEON_URL%" -f dump.sql

if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao importar dados para o Neon.
    pause
    exit /b
)

echo.
echo [3/3] Limpando arquivo temporário...
del dump.sql

echo.
echo ===================================================
echo  MIGRACAO CONCLUIDA COM SUCESSO!
echo  Seu banco de dados agora esta na nuvem!
echo ===================================================
pause
