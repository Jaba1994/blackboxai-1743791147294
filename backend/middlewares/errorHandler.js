const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error('Error:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Handle different types of errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.message
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid Token',
            details: 'Authentication failed'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token Expired',
            details: 'Please login again'
        });
    }

    if (err.statusCode === 404) {
        return res.status(404).json({
            error: 'Not Found',
            details: err.message
        });
    }

    if (err.name === 'MongoError' && err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate Entry',
            details: 'Resource already exists'
        });
    }

    // Rate limit error
    if (err.statusCode === 429) {
        return res.status(429).json({
            error: 'Too Many Requests',
            details: 'Please try again later'
        });
    }

    // OpenAI API error
    if (err.name === 'OpenAIError') {
        return res.status(503).json({
            error: 'AI Service Error',
            details: err.message
        });
    }

    // Figma API error
    if (err.name === 'FigmaError') {
        return res.status(503).json({
            error: 'Figma Service Error',
            details: err.message
        });
    }

    // Default error
    return res.status(500).json({
        error: 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

// Custom error class for API errors
class APIError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'APIError';
        this.statusCode = statusCode;
    }
}

module.exports = {
    errorHandler,
    APIError
};