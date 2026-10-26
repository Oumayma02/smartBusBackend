
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }

    return secret;
};

const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
        return res.status(401).json({
            message: 'Non autorisé, pas de token valide',
        });
    }

    try {
        const token = authorization.split(/\s+/)[1];

        const decoded = jwt.verify(token, getJwtSecret(), {
            algorithms: ['HS256'],
        });

        const user = await User.findById(decoded.userId)
            .select('-password');

        if (!user) {
            return res.status(401).json({
                message: 'Non autorisé',
            });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error.message === 'JWT_SECRET is not configured') {
            return next(error);
        }

        if (error.name === 'JsonWebTokenError' ||
            error.name === 'TokenExpiredError' ||
            error.name === 'NotBeforeError') {
            return res.status(401).json({
                message: 'Non autorisé, token invalide ou expiré',
            });
        }

        return next(error);
    }
};

const isSuperAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
        return next();
    }

    return res.status(403).json({
        message: 'Accès interdit, rôle superadmin requis',
    });
};

const isSuperOrAdmin = (req, res, next) => {
    if (req.user &&
        (req.user.role === 'superadmin' || req.user.role === 'admin')) {
        return next();
    }

    return res.status(403).json({
        message: 'Accès interdit, rôle superadmin ou admin requis',
    });
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }

    return res.status(403).json({
        message: 'Accès interdit, rôle admin requis',
    });
};

module.exports = {
    protect,
    isSuperAdmin,
    isAdmin,
    isSuperOrAdmin,
};
