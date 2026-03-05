import { auth } from './modules/auth.js';

class Database {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.storage = window.localStorage;
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

            // Adicionar Token JWT do módulo de auth
            const token = auth.getToken();
            if (token) {
                options.headers['Authorization'] = `Bearer ${token}`;
            }

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
            throw error;
        }
    }

    // Obter ID do usuário logado do módulo de auth
    getUsuarioId() {
        const u = auth.getUsuario();
        return u ? u.id : null;
    }

    // Obter CPF do usuário (armazenado localmente)
    getUserCPF() {
        return this.storage.getItem('userCPF');
    }

    setUserCPF(cpf) {
        this.storage.setItem('userCPF', cpf);
    }

    // ==================== CADASTRO DO BATEDOR ====================

    async saveCadastro(data) {
        try {
            const usuarioId = this.getUsuarioId();
            const payload = { ...data, usuarioId };
            const result = await this.apiRequest('/batedor', 'POST', payload);

            this.setUserCPF(data.cpf);
            this.storage.setItem('cadastro', JSON.stringify(data));

            return result;
        } catch (error) {
            // Fallback local em caso de erro de rede
            this.storage.setItem('cadastro', JSON.stringify(data));
            this.setUserCPF(data.cpf);
            return { success: true, data: data, offline: true };
        }
    }

    async getCadastro() {
        const cpf = this.getUserCPF();
        const usuarioId = this.getUsuarioId();

        // 1. Tentar buscar por CPF no cache
        if (cpf && cpf !== 'null') {
            try {
                const result = await this.apiRequest(`/batedor/${cpf}`);
                this.storage.setItem('cadastro', JSON.stringify(result.data));
                this.setUserCPF(result.data.cpf);
                return result.data;
            } catch (error) {
                const local = this.storage.getItem('cadastro');
                if (local) return JSON.parse(local);
            }
        }

        // 2. Fallback: buscar pela conta de usuário logado
        if (usuarioId) {
            try {
                const result = await this.apiRequest(`/meu-cadastro/${usuarioId}`);
                if (result.data) {
                    this.storage.setItem('cadastro', JSON.stringify(result.data));
                    this.setUserCPF(result.data.cpf);
                    return result.data;
                }
            } catch (error) { }
        }

        const local = this.storage.getItem('cadastro');
        return local ? JSON.parse(local) : null;
    }

    // ==================== CHECK-LISTS ====================

    async saveChecklist(checklist) {
        const cpf = this.getUserCPF();
        if (!cpf || cpf === 'null') {
            throw new Error('CPF não encontrado. Complete seu cadastro antes de preencher o check-list.');
        }

        try {
            const data = { cpf, ...checklist };
            const result = await this.apiRequest('/checklist', 'POST', data);

            const checklists = this.getChecklistsFromCache();
            checklists.push(result.data || checklist);
            this.storage.setItem('checklists', JSON.stringify(checklists));

            return result;
        } catch (error) {
            if (error.message.includes('preenchido')) throw error;
            throw error;
        }
    }

    async getChecklists() {
        const cpf = this.getUserCPF();
        if (!cpf) return { data: this.getChecklistsFromCache(), preenchidoHoje: false };

        try {
            const result = await this.apiRequest(`/checklists/${cpf}`);
            if (result.data) this.storage.setItem('checklists', JSON.stringify(result.data));
            return result;
        } catch (error) {
            return { data: this.getChecklistsFromCache(), preenchidoHoje: false };
        }
    }

    getChecklistsFromCache() {
        const data = this.storage.getItem('checklists');
        return data ? JSON.parse(data) : [];
    }

    async getRecentChecklists(days) {
        const cpf = this.getUserCPF();
        if (!cpf || cpf === 'null') return [];

        try {
            const result = await this.apiRequest(`/checklists/${cpf}?dias=${days}`);
            return result.data || [];
        } catch (error) {
            const checklists = this.getChecklistsFromCache();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            return checklists.filter(c => new Date(c.data_checklist || c.data) >= cutoffDate);
        }
    }

    // ==================== CÁLCULOS DE CLORAÇÃO ====================

    async saveCalculation(calculation) {
        const cpf = this.getUserCPF();
        try {
            const data = { cpf, ...calculation };
            const result = await this.apiRequest('/calculo', 'POST', data);

            const calculations = this.getCalculationsFromCache();
            calculations.push(result.data || calculation);
            this.storage.setItem('calculations', JSON.stringify(calculations));

            return result;
        } catch (error) {
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
        if (!cpf) return this.getCalculationsFromCache();

        try {
            const result = await this.apiRequest(`/calculos/${cpf}`);
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
            const result = await this.apiRequest('/selo', 'POST', { cpf, tipo: selo.tipo });
            this.storage.setItem('selo', JSON.stringify(result.data || selo));
            return result;
        } catch (error) {
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
            if (result.data) this.storage.setItem('selo', JSON.stringify(result.data));
            return result.data;
        } catch (error) {
            const data = this.storage.getItem('selo');
            return data ? JSON.parse(data) : null;
        }
    }

    // ==================== REQUISITOS DOS SELOS ====================

    async getRequisitosFromAPI() {
        const cpf = this.getUserCPF();
        if (!cpf || cpf === 'null') return null;

        try {
            const result = await this.apiRequest(`/requisitos/${cpf}`);
            if (result && result.data) {
                result.data.forEach(req => {
                    const key = `requisito_${req.tipo_selo}_${req.numero_requisito}`;
                    this.storage.setItem(key, req.status.toString());
                });
                return result.data;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async saveRequisitoStatus(tipo, requisito, status) {
        const cpf = this.getUserCPF();
        try {
            const result = await this.apiRequest('/requisito', 'POST', {
                cpf, tipoSelo: tipo, numeroRequisito: requisito, status
            });
            this.storage.setItem(`requisito_${tipo}_${requisito}`, status);
            return result;
        } catch (error) {
            this.storage.setItem(`requisito_${tipo}_${requisito}`, status);
            return { success: true, offline: true };
        }
    }

    getRequisitoStatus(tipo, requisito) {
        return this.storage.getItem(`requisito_${tipo}_${requisito}`) === 'true';
    }

    // ==================== ESTATÍSTICAS ====================

    async getEstatisticas() {
        const cpf = this.getUserCPF();
        if (!cpf) return null;
        try {
            const result = await this.apiRequest(`/estatisticas/${cpf}`);
            return result.data;
        } catch (error) {
            return null;
        }
    }

    // ==================== UTILITÁRIOS ====================

    clearAll() {
        auth.logout();
        this.storage.clear();
    }

    async checkConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/../`, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

export const db = new Database();
