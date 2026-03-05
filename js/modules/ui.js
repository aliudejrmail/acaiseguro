/**
 * Módulo de UI e Navegação
 */

export const ui = {
    showPage(pageId) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    mostrarNotificacao(mensagem, tipo = 'sucesso') {
        // Implementação simplificada para uso global
        // Pode ser expandida para usar um elemento toast
        alert(mensagem);
    },

    toggleLoader(show) {
        // Implementar se houver um loader global
    }
};
