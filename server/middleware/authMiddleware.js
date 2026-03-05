const { verificarToken } = require('../config/auth');

/**
 * Middleware para autenticação via JWT
 */
const autenticar = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido ou inválido' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verificarToken(token);

    if (!payload) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.usuario = payload;
    next();
};

/**
 * Middleware para autorização baseada em roles
 * @param {...string} rolesPermitidas Lista de roles que podem acessar a rota
 */
const autorizar = (...rolesPermitidas) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return res.status(401).json({ error: 'Não autenticado' });
        }

        if (!rolesPermitidas.includes(req.usuario.role)) {
            return res.status(403).json({ error: 'Acesso negado: privilégios insuficientes' });
        }

        next();
    };
};

module.exports = {
    autenticar,
    autorizar
};
