/**
 * Input Validation Middleware
 * Express-validator rules for common inputs
 */

const { body, param, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map(err => err.msg);
        throw AppError.badRequest(messages.join('. '));
    }
    next();
};

// ==================== AUTH VALIDATORS ====================

const validateSignup = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),

    validate
];

const validateLogin = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    validate
];

const validateForgotPassword = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    validate
];

const validateVerifyOtp = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('otp')
        .trim()
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),

    validate
];

const validateResetPassword = [
    body('resetToken')
        .notEmpty()
        .withMessage('Reset token is required'),

    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),

    validate
];

const validateProfileUpdate = [
    body('username')
        .optional()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must be less than 500 characters'),

    body('profilePicture')
        .optional()
        .trim(),

    validate
];

const validateRefreshToken = [
    body('refreshToken')
        .notEmpty()
        .withMessage('Refresh token is required'),

    validate
];

// ==================== VIDEO VALIDATORS ====================

const validateVideoUpload = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 100 })
        .withMessage('Title must be 3-100 characters')
        .escape(),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Description must be less than 5000 characters')
        .escape(),

    validate
];

const validateVideoId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid video ID'),

    validate
];

/**
 * File validation middleware
 */
const validateFileUpload = (req, res, next) => {
    if (!req.file) {
        throw AppError.badRequest('Please upload a video file');
    }

    const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw AppError.badRequest('Invalid file type. Only MP4, WebM, OGG, and MOV are allowed');
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (req.file.size > maxSize) {
        throw AppError.badRequest('File size exceeds 500MB limit');
    }

    next();
};

module.exports = {
    validate,
    validateSignup,
    validateLogin,
    validateForgotPassword,
    validateVerifyOtp,
    validateResetPassword,
    validateProfileUpdate,
    validateRefreshToken,
    validateVideoUpload,
    validateVideoId,
    validateFileUpload
};
