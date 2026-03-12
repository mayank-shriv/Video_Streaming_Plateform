/**
 * Centralized Error Handler Middleware
 * Handles all errors and sends appropriate responses
 */

const AppError = require('../utils/AppError');

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;

    // Log error for debugging (exclude in production later with logger)
    if (process.env.NODE_ENV === 'development') {
        console.error('ERROR 💥', err);
    }

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = AppError.notFound(message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
        error = AppError.conflict(message);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        const message = messages.join('. ');
        error = AppError.badRequest(message);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = AppError.unauthorized('Invalid token');
    }

    if (err.name === 'TokenExpiredError') {
        error = AppError.unauthorized('Token expired');
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = AppError.badRequest('File too large');
        } else {
            error = AppError.badRequest(`Upload error: ${err.message}`);
        }
    }

    // Send response
    res.status(error.statusCode).json({
        status: error.status || 'error',
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
