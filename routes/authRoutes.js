const express = require('express');
const router = express.Router();
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { auth } = require('../middleware/auth');
const {
    validateSignup,
    validateLogin,
    validateForgotPassword,
    validateVerifyOtp,
    validateResetPassword,
    validateProfileUpdate,
    validateRefreshToken,
} = require('../middleware/validation');
const AppError = require('../utils/AppError');
const { generateTokenPair, verifyRefreshToken, generateResetToken, verifyResetToken } = require('../utils/tokenService');
const { generateOTP, sendOTP } = require('../utils/emailService');

// ==================== SIGNUP ====================
router.post('/signup', validateSignup, asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw AppError.conflict('Username or email already exists');
    }

    const user = new User({ username, email, password });

    // Generate token pair
    const tokens = generateTokenPair(user._id);
    user.setRefreshToken(tokens.refreshToken);
    await user.save();

    res.status(201).json({
        user: user.toSafeObject(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    });
}));

// ==================== LOGIN ====================
router.post('/login', validateLogin, asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
        throw AppError.unauthorized('Invalid login credentials');
    }

    // Generate token pair
    const tokens = generateTokenPair(user._id);
    user.setRefreshToken(tokens.refreshToken);
    await user.save();

    res.json({
        user: user.toSafeObject(),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    });
}));

// ==================== REFRESH TOKEN ====================
router.post('/refresh', validateRefreshToken, asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    // Verify the refresh token JWT
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
        throw AppError.unauthorized('Invalid or expired refresh token');
    }

    // Find user and verify the stored refresh token matches
    const user = await User.findById(decoded.userId);
    if (!user || !user.verifyRefreshToken(refreshToken)) {
        throw AppError.unauthorized('Invalid refresh token');
    }

    // Generate new token pair (rotate refresh token)
    const tokens = generateTokenPair(user._id);
    user.setRefreshToken(tokens.refreshToken);
    await user.save();

    res.json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
    });
}));

// ==================== LOGOUT ====================
router.post('/logout', auth, asyncHandler(async (req, res) => {
    req.user.clearRefreshToken();
    await req.user.save();
    res.json({ message: 'Logged out successfully' });
}));

// ==================== FORGOT PASSWORD (Send OTP) ====================
router.post('/forgot-password', validateForgotPassword, asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        // Don't reveal whether the email exists
        return res.json({ message: 'If this email is registered, you will receive an OTP.' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    user.setOTP(otp);
    await user.save();

    // Send OTP via email
    try {
        await sendOTP(email, otp);
    } catch (err) {
        console.error('Failed to send OTP email:', err.message);
        user.clearOTP();
        await user.save();
        throw AppError.internal('Failed to send OTP email. Please try again.');
    }

    res.json({ message: 'If this email is registered, you will receive an OTP.' });
}));

// ==================== VERIFY OTP ====================
router.post('/verify-otp', validateVerifyOtp, asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw AppError.badRequest('Invalid email or OTP');
    }

    if (!user.verifyOTP(otp)) {
        throw AppError.badRequest('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    user.clearOTP();
    await user.save();

    // Generate a temporary reset token
    const resetToken = generateResetToken(user._id);

    res.json({
        message: 'OTP verified successfully',
        resetToken,
    });
}));

// ==================== RESET PASSWORD ====================
router.post('/reset-password', validateResetPassword, asyncHandler(async (req, res) => {
    const { resetToken, newPassword } = req.body;

    let decoded;
    try {
        decoded = verifyResetToken(resetToken);
    } catch (err) {
        throw AppError.unauthorized('Invalid or expired reset token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
        throw AppError.notFound('User not found');
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    // Clear all sessions for security
    user.clearRefreshToken();
    await user.save();

    res.json({ message: 'Password reset successfully. Please log in with your new password.' });
}));

// ==================== GET PROFILE ====================
router.get('/profile', auth, asyncHandler(async (req, res) => {
    res.json({ user: req.user.toSafeObject() });
}));

// ==================== UPDATE PROFILE ====================
router.put('/profile', auth, validateProfileUpdate, asyncHandler(async (req, res) => {
    const { username, bio, profilePicture } = req.body;
    const user = req.user;

    // If changing username, check uniqueness
    if (username && username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) {
            throw AppError.conflict('Username already taken');
        }
        user.username = username;
    }

    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;

    await user.save();

    res.json({
        message: 'Profile updated successfully',
        user: user.toSafeObject(),
    });
}));

module.exports = router;
