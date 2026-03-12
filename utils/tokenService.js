/**
 * Token Service
 * Handles access token and refresh token generation/verification
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_access_secret_change_me';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_change_me';

const ACCESS_TOKEN_EXPIRY = '15m';   // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d';   // 7 days
const RESET_TOKEN_EXPIRY = '10m';    // 10 minutes for password reset

/**
 * Generate short-lived access token
 */
function generateAccessToken(userId) {
    return jwt.sign({ userId, type: 'access' }, JWT_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRY,
    });
}

/**
 * Generate long-lived refresh token
 */
function generateRefreshToken(userId) {
    return jwt.sign({ userId, type: 'refresh' }, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRY,
    });
}

/**
 * Generate a temporary reset token after OTP verification
 */
function generateResetToken(userId) {
    return jwt.sign({ userId, type: 'reset' }, JWT_SECRET, {
        expiresIn: RESET_TOKEN_EXPIRY,
    });
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Verify refresh token
 */
function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

/**
 * Verify reset token
 */
function verifyResetToken(token) {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'reset') {
        throw new Error('Invalid token type');
    }
    return decoded;
}

/**
 * Generate both access + refresh tokens
 */
function generateTokenPair(userId) {
    return {
        accessToken: generateAccessToken(userId),
        refreshToken: generateRefreshToken(userId),
    };
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateResetToken,
    verifyAccessToken,
    verifyRefreshToken,
    verifyResetToken,
    generateTokenPair,
};
