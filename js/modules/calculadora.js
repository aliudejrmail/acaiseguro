/**
 * Módulo da Calculadora de Cloração
 */
import { db } from '../database.js';

export const calculadora = {
    calcular(quantidadeAgua, concentracaoCloro) {
        // Fórmula: (Qtd Água * PPM Desejado) / (Concentração Cloro * 10)
        // PPM Desejado para açaí: 150 ppm (média entre 100 e 200)
        const ppmDesejado = 150;
        const resultado = (quantidadeAgua * ppmDesejado) / (concentracaoCloro * 10);

        return resultado.toFixed(1);
    },

    async salvarCalculo(quantidadeAgua, concentracaoCloro, resultado) {
        const calculation = {
            data: new Date().toISOString(),
            quantidadeAgua,
            concentracaoCloro,
            resultado
        };

        try {
            await db.saveCalculation(calculation);
            return true;
        } catch (error) {
            console.error('Erro ao salvar cálculo:', error);
            return false;
        }
    },

    getTempoImersao() {
        return "15 minutos";
    }
};
