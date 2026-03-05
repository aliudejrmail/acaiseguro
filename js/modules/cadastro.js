/**
 * Módulo de Cadastro de Batedores
 */
import { db } from '../database.js';
import { auth } from './auth.js';

export const cadastro = {
    async salvar(dados) {
        // Validações básicas
        if (!dados.nome || !dados.cpf || !dados.nomeFantasia) {
            throw new Error('Preencha todos os campos obrigatórios.');
        }

        try {
            const result = await db.saveCadastro(dados);
            return result;
        } catch (error) {
            console.error('Erro no módulo de cadastro:', error);
            throw error;
        }
    },

    async carregar() {
        return await db.getCadastro();
    },

    async buscarCEP(cep) {
        cep = cep.replace(/\D/g, '');
        if (cep.length !== 8) return null;

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            if (data.erro) return null;
            return data;
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            return null;
        }
    }
};
