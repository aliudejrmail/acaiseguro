// Database.js - Gerenciamento de dados usando API REST + localStorage como cache

class Database {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.storage = window.localStorage;
        this.userCPF = null; // CPF do usuário logado
    }

    // Método helper para fazer requisições à API
    async apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(`${this.apiUrl}${endpoint}`, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro na requisição');
            }

            return result;
        } catch (error) {
            console.error('Erro na API:', error);
            // Fallback para localStorage em caso de erro
            console.warn('Usando fallback LocalStorage');
            throw error;
        }
    }

    // Obter ID do usuário logado (salvo após login)
    getUsuarioId() {
        const u = this.storage.getItem('usuario');
        if (!u) return null;
        try { return JSON.parse(u).id; } catch { return null; }
    }

    // Obter CPF do usuário (armazenado localmente)
    getUserCPF() {
        if (!this.userCPF) {
            this.userCPF = this.storage.getItem('userCPF');
        }
        return this.userCPF;
    }

    setUserCPF(cpf) {
        this.userCPF = cpf;
        this.storage.setItem('userCPF', cpf);
    }

    // ==================== CADASTRO DO BATEDOR ====================

    async saveCadastro(data) {
        try {
            // Incluir usuario_id para vincular ao login
            const usuarioId = this.getUsuarioId();
            const payload = { ...data, usuarioId };
            const result = await this.apiRequest('/batedor', 'POST', payload);
            
            // Armazenar CPF do usuário
            this.setUserCPF(data.cpf);
            
            // Cache local
            this.storage.setItem('cadastro', JSON.stringify(data));
            
            return result;
        } catch (error) {
            // Fallback: salvar apenas localmente
            this.storage.setItem('cadastro', JSON.stringify(data));
            this.setUserCPF(data.cpf);
            return { success: true, data: data, offline: true };
        }
    }

    async getCadastro() {
        const cpf = this.getUserCPF();

        // 1. Tentar buscar por CPF (mais rápido, usa cache local)
        if (!cpf) {
            const local = this.storage.getItem('cadastro');
            if (local) return JSON.parse(local);
        }

        // 2. Tentar API com CPF
        if (cpf && cpf !== 'null') {
            try {
                const result = await this.apiRequest(`/batedor/${cpf}`);
                this.storage.setItem('cadastro', JSON.stringify(result.data));
                // Garantir que CPF fica salvo
                this.setUserCPF(result.data.cpf);
                return result.data;
            } catch (error) {
                const local = this.storage.getItem('cadastro');
                if (local) return JSON.parse(local);
            }
        }

        // 3. Fallback: buscar pela conta de usuário logado (usuario_id)
        const usuarioId = this.getUsuarioId();
        if (usuarioId) {
            try {
                const result = await this.apiRequest(`/meu-cadastro/${usuarioId}`);
                if (result.data) {
                    this.storage.setItem('cadastro', JSON.stringify(result.data));
                    this.setUserCPF(result.data.cpf);
                    return result.data;
                }
            } catch (error) {
                // servidor indisponível
            }
        }

        return null;
    }

    // ==================== CHECK-LISTS ====================

    async saveChecklist(checklist) {
        const cpf = this.getUserCPF();
        
        if (!cpf || cpf === 'null') {
            throw new Error('CPF não encontrado. Complete seu cadastro antes de preencher o check-list.');
        }
        
        try {
            const data = {
                cpf: cpf,
                ...checklist
            };
            
            const result = await this.apiRequest('/checklist', 'POST', data);
            
            // Atualizar cache local
            const checklists = this.getChecklistsFromCache();
            checklists.push(checklist);
            this.storage.setItem('checklists', JSON.stringify(checklists));
            
            return result;
        } catch (error) {
            // Se for erro de check-list diário, propagar o erro
            if (error.codigo === 'CHECKLIST_DIARIO_JA_PREENCHIDO') {
                throw error;
            }
            
            // Para outros erros, propagar também para debug
            console.error('Erro ao salvar check-list:', error);
            throw error;
        }
    }

    async getChecklists() {
        const cpf = this.getUserCPF();
        
        if (!cpf) {
            return { data: this.getChecklistsFromCache(), preenchidoHoje: false };
        }

        try {
            const result = await this.apiRequest(`/checklists/${cpf}`);
            
            // Atualizar cache
            if (result.data) {
                this.storage.setItem('checklists', JSON.stringify(result.data));
            }
            
            return result; // Retorna o objeto completo com preenchidoHoje
        } catch (error) {
            // Fallback: usar cache local
            return { data: this.getChecklistsFromCache(), preenchidoHoje: false };
        }
    }

    getChecklistsFromCache() {
        const data = this.storage.getItem('checklists');
        return data ? JSON.parse(data) : [];
    }

    async getRecentChecklists(days) {
        const cpf = this.getUserCPF();
        if (!cpf || cpf === 'null') {
            // Não faz requisição se CPF não estiver definido
            console.warn('CPF do usuário não definido. Não é possível buscar checklists.');
            return [];
        }
        try {
            const result = await this.apiRequest(`/checklists/${cpf}?dias=${days}`);
            // Retornar os dados da API (result.data é o array de check-lists)
            if (result && result.data) {
                return result.data;
            }
            return [];
        } catch (error) {
            console.warn('Erro ao buscar checklists da API, usando fallback local:', error);
            // Fallback: filtrar cache local apenas em caso de erro de conexão
            const checklists = this.getChecklistsFromCache();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            return checklists.filter(c => {
                const checkDate = new Date(c.data || c.data_checklist);
                return checkDate >= cutoffDate;
            });
        }
    }

    // ==================== CÁLCULOS DE CLORAÇÃO ====================

    async saveCalculation(calculation) {
        const cpf = this.getUserCPF();
        
        try {
            const data = {
                cpf: cpf,
                quantidadeAgua: calculation.quantidadeAgua,
                concentracaoCloro: calculation.concentracaoCloro,
                resultado: calculation.resultado
            };
            
            const result = await this.apiRequest('/calculo', 'POST', data);
            
            // Atualizar cache
            const calculations = this.getCalculationsFromCache();
            calculations.push(calculation);
            this.storage.setItem('calculations', JSON.stringify(calculations));
            
            return result;
        } catch (error) {
            // Fallback: salvar localmente
            const calculations = this.getCalculationsFromCache();
            calculations.push(calculation);
            this.storage.setItem('calculations', JSON.stringify(calculations));
            return { success: true, data: calculation, offline: true };
        }
    }

    getCalculationsFromCache() {
        const data = this.storage.getItem('calculations');
        return data ? JSON.parse(data) : [];
    }

    async getCalculations() {
        const cpf = this.getUserCPF();
        
        if (!cpf) {
            return this.getCalculationsFromCache();
        }

        try {
            const result = await this.apiRequest(`/calculos/${cpf}`);
            
            // Atualizar cache
            this.storage.setItem('calculations', JSON.stringify(result.data));
            
            return result.data;
        } catch (error) {
            return this.getCalculationsFromCache();
        }
    }

    // ==================== SELOS ====================

    async saveSelo(selo) {
        const cpf = this.getUserCPF();
        
        try {
            const data = {
                cpf: cpf,
                tipo: selo.tipo
            };
            
            const result = await this.apiRequest('/selo', 'POST', data);
            
            // Atualizar cache
            this.storage.setItem('selo', JSON.stringify(selo));
            
            return result;
        } catch (error) {
            // Fallback
            this.storage.setItem('selo', JSON.stringify(selo));
            return { success: true, data: selo, offline: true };
        }
    }

    async getSelo() {
        const cpf = this.getUserCPF();
        
        if (!cpf) {
            const data = this.storage.getItem('selo');
            return data ? JSON.parse(data) : null;
        }

        try {
            const result = await this.apiRequest(`/selo/${cpf}`);
            
            // Atualizar cache
            if (result.data) {
                this.storage.setItem('selo', JSON.stringify(result.data));
            }
            
            return result.data;
        } catch (error) {
            const data = this.storage.getItem('selo');
            return data ? JSON.parse(data) : null;
        }
    }

    // ==================== REQUISITOS DOS SELOS ====================

    async getRequisitosFromAPI() {
        const cpf = this.getUserCPF();
        
        console.log('getRequisitosFromAPI() - CPF:', cpf);
        
        if (!cpf || cpf === 'null') {
            console.log('getRequisitosFromAPI() - CPF inválido, retornando null');
            return null;
        }
        
        try {
            const result = await this.apiRequest(`/requisitos/${cpf}`);
            console.log('getRequisitosFromAPI() - Resultado da API:', result);
            
            if (result && result.data) {
                // Atualizar localStorage com dados do servidor
                result.data.forEach(req => {
                    const key = `requisito_${req.tipo_selo}_${req.numero_requisito}`;
                    const newValue = req.status.toString();
                    console.log(`Atualizando localStorage["${key}"] = "${newValue}"`);
                    this.storage.setItem(key, newValue);
                });
                return result.data;
            }
            console.log('getRequisitosFromAPI() - Sem dados na resposta');
            return null;
        } catch (error) {
            console.warn('Erro ao buscar requisitos da API:', error);
            return null;
        }
    }

    async saveRequisitoStatus(tipo, requisito, status) {
        const cpf = this.getUserCPF();
        
        try {
            const data = {
                cpf: cpf,
                tipoSelo: tipo,
                numeroRequisito: requisito,
                status: status
            };
            
            const result = await this.apiRequest('/requisito', 'POST', data);
            
            // Atualizar cache
            const key = `requisito_${tipo}_${requisito}`;
            this.storage.setItem(key, status);
            
            return result;
        } catch (error) {
            // Fallback
            const key = `requisito_${tipo}_${requisito}`;
            this.storage.setItem(key, status);
            return { success: true, offline: true };
        }
    }

    getRequisitoStatus(tipo, requisito) {
        const key = `requisito_${tipo}_${requisito}`;
        const value = this.storage.getItem(key);
        console.log(`getRequisitoStatus(${tipo}, ${requisito}): localStorage["${key}"] = "${value}" → ${value === 'true'}`);
        return value === 'true';
    }

    // ==================== ESTATÍSTICAS ====================

    async getEstatisticas() {
        const cpf = this.getUserCPF();
        
        if (!cpf) {
            return null;
        }

        try {
            const result = await this.apiRequest(`/estatisticas/${cpf}`);
            return result.data;
        } catch (error) {
            return null;
        }
    }

    // ==================== UTILITÁRIOS ====================

    // Limpar dados (para testes)
    clearAll() {
        this.storage.clear();
        this.userCPF = null;
    }

    // Verificar conexão com API
    async checkConnection() {
        try {
            const response = await fetch('http://localhost:3000/');
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Instância global do database
const db = new Database();
