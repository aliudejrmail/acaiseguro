/**
 * Módulo de Check-list BPF
 */
import { db } from '../database.js';

export const bpf = {
    async salvarChecklist(dados) {
        try {
            const result = await db.saveChecklist(dados);
            return result;
        } catch (error) {
            console.error('Erro ao salvar checklist:', error);
            throw error;
        }
    },

    async listarHistorico() {
        return await db.getChecklists();
    },

    calcularConformidade(higieneCount, ambienteCount, pragasCount, aguaCount, equipamentosCount) {
        const totalItens = 5 + 6 + 4 + 3 + 4; // Total de itens no checklist
        const totalMarcados = higieneCount + ambienteCount + pragasCount + aguaCount + equipamentosCount;
        return ((totalMarcados / totalItens) * 100).toFixed(1);
    }
};
