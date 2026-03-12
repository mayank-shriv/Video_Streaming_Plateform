const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },

    // Profile fields
    bio: {
        type: String,
        default: '',
        maxlength: 500,
    },
    profilePicture: {
        type: String,
        default: '',
    },

    // Refresh token (hashed)
    refreshToken: {
        type: String,
        default: null,
    },

    // OTP for password reset
    otp: {
        type: String,
        default: null,
    },
    otpExpires: {
        type: Date,
        default: null,
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Set OTP with hashing and expiry (10 min)
userSchema.methods.setOTP = function (otp) {
    this.otp = crypto.createHash('sha256').update(otp).digest('hex');
    this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
};

// Verify OTP
userSchema.methods.verifyOTP = function (otp) {
    if (!this.otp || !this.otpExpires) return false;
    if (new Date() > this.otpExpires) return false; // expired
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    return this.otp === hash;
};

// Clear OTP after use
userSchema.methods.clearOTP = function () {
    this.otp = null;
    this.otpExpires = null;
};

// Store hashed refresh token
userSchema.methods.setRefreshToken = function (token) {
    this.refreshToken = crypto.createHash('sha256').update(token).digest('hex');
};

// Verify refresh token
userSchema.methods.verifyRefreshToken = function (token) {
    if (!this.refreshToken) return false;
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return this.refreshToken === hash;
};

// Clear refresh token (logout)
userSchema.methods.clearRefreshToken = function () {
    this.refreshToken = null;
};

// Return safe user object (without sensitive fields)
userSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        username: this.username,
        email: this.email,
        bio: this.bio,
        profilePicture: this.profilePicture,
        createdAt: this.createdAt,
    };
};

module.exports = mongoose.model('User', userSchema);
