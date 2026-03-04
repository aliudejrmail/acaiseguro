# 📝 Scripts de Instalação Rápida

## Windows

### install.bat
```batch
@echo off
echo ========================================
echo   INSTALACAO ACAI SEGURO
echo ========================================
echo.

echo [1/4] Instalando dependencias do servidor...
cd server
call npm install

echo.
echo [2/4] Criando arquivo .env...
if not exist .env (
    copy .env.example .env
    echo Arquivo .env criado! Por favor, configure suas credenciais.
)

echo.
echo [3/4] Verificando PostgreSQL...
psql --version
if errorlevel 1 (
    echo ERRO: PostgreSQL nao encontrado!
    echo Por favor, instale o PostgreSQL primeiro.
    pause
    exit /b 1
)

echo.
echo [4/4] Instalacao concluida!
echo.
echo PROXIMOS PASSOS:
echo 1. Configure o arquivo server\.env com suas credenciais
echo 2. Execute: psql -U postgres -d acaiseguro -f sql\schema.sql
echo 3. Execute: start-server.bat
echo 4. Abra index.html no navegador
echo.
pause
```

### start-server.bat
```batch
@echo off
echo Iniciando servidor Acai Seguro...
cd server
npm run dev
```

### setup-database.bat
```batch
@echo off
echo ========================================
echo   SETUP BANCO DE DADOS ACAI SEGURO
echo ========================================
echo.

set /p DB_PASSWORD="Digite a senha do PostgreSQL: "

echo Criando banco de dados...
psql -U postgres -c "CREATE DATABASE acaiseguro;"

echo Executando schema...
psql -U postgres -d acaiseguro -f sql\schema.sql

echo.
echo Banco de dados configurado com sucesso!
pause
```

---

## Linux/Mac

### install.sh
```bash
#!/bin/bash

echo "========================================"
echo "   INSTALACAO ACAI SEGURO"
echo "========================================"
echo ""

echo "[1/4] Instalando dependencias do servidor..."
cd server
npm install

echo ""
echo "[2/4] Criando arquivo .env..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Arquivo .env criado! Por favor, configure suas credenciais."
fi

echo ""
echo "[3/4] Verificando PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "ERRO: PostgreSQL nao encontrado!"
    echo "Por favor, instale o PostgreSQL primeiro."
    exit 1
fi

echo ""
echo "[4/4] Instalacao concluida!"
echo ""
echo "PROXIMOS PASSOS:"
echo "1. Configure o arquivo server/.env com suas credenciais"
echo "2. Execute: ./setup-database.sh"
echo "3. Execute: ./start-server.sh"
echo "4. Abra index.html no navegador"
echo ""
```

### start-server.sh
```bash
#!/bin/bash
echo "Iniciando servidor Acai Seguro..."
cd server
npm run dev
```

### setup-database.sh
```bash
#!/bin/bash

echo "========================================"
echo "   SETUP BANCO DE DADOS ACAI SEGURO"
echo "========================================"
echo ""

read -sp "Digite a senha do PostgreSQL: " DB_PASSWORD
echo ""

echo "Criando banco de dados..."
PGPASSWORD=$DB_PASSWORD psql -U postgres -c "CREATE DATABASE acaiseguro;"

echo "Executando schema..."
PGPASSWORD=$DB_PASSWORD psql -U postgres -d acaiseguro -f sql/schema.sql

echo ""
echo "Banco de dados configurado com sucesso!"
```

---

## Tornar scripts executáveis (Linux/Mac)

```bash
chmod +x install.sh
chmod +x start-server.sh
chmod +x setup-database.sh
```
