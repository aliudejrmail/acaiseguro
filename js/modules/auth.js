/**
 * Módulo de Autenticação e Gestão de Tokens
 */

const STORAGE_KEYS = {
    USER: 'usuario',
    GESTOR: 'gestorLogado',
    TOKEN: 'token',
    CPF: 'userCPF'
};

export const auth = {
    setToken(token) {
        if (token) {
            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        } else {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
        }
    },

    getToken() {
        return localStorage.getItem(STORAGE_KEYS.TOKEN);
    },

    setUsuario(usuario) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(usuario));
    },

    getUsuario() {
        const user = localStorage.getItem(STORAGE_KEYS.USER);
        return user ? JSON.parse(user) : null;
    },

    setGestor(gestor) {
        localStorage.setItem(STORAGE_KEYS.GESTOR, JSON.stringify(gestor));
    },

    getGestor() {
        const gestor = localStorage.getItem(STORAGE_KEYS.GESTOR);
        return gestor ? JSON.parse(gestor) : null;
    },

    logout() {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.GESTOR);
        localStorage.removeItem(STORAGE_KEYS.CPF);
        // Não removemos o rascunho para não frustrar o usuário caso ele volte
    },

    isAuthenticated() {
        return !!this.getToken();
    }
};
