const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_for_dev_only';
const JWT_EXPIRES_IN = '7d';

/**
 * Gera um token JWT para o usuário
 * @param {Object} usuario Objeto do usuário (id, nome, email, role)
 * @returns {string} Token JWT
 */
const gerarToken = (usuario) => {
    return jwt.sign(
        { 
            id: usuario.id, 
            nome: usuario.nome, 
            email: usuario.email, 
            role: usuario.role 
        }, 
        JWT_SECRET, 
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Verifica se um token é válido
 * @param {string} token Token JWT
 * @returns {Object|null} Payload do token ou null se inválido
 */
const verificarToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

module.exports = {
    gerarToken,
    verificarToken
};
