const jwt = require('jsonwebtoken');
const { APIError } = require('./errorHandler');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new APIError('No token provided', 401);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            throw new APIError('User not found', 401);
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new APIError('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new APIError('Token expired', 401));
        }
        next(error);
    }
};

/**
 * Middleware to check if user has required role
 * @param {string[]} roles - Array of required roles
 */
const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new APIError('User not authenticated', 401));
        }

        if (!roles.includes(req.user.role)) {
            return next(new APIError('Unauthorized access', 403));
        }

        next();
    };
};

/**
 * Middleware to validate API key for external services
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn('Invalid API key attempt', {
            ip: req.ip,
            path: req.path,
            apiKey: apiKey
        });
        return next(new APIError('Invalid API key', 401));
    }

    next();
};

module.exports = {
    authenticateToken,
    checkRole,
    validateApiKey
};