const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Video = require('../models/Video');
const { verifyAccessToken } = require('../utils/tokenService');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new Error();
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        res.status(401).json({ error: 'Please authenticate.' });
    }
};

const isOwner = async (req, res, next) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }

        if (video.uploader && video.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not authorized to delete this video' });
        }

        req.video = video;
        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error during ownership check' });
    }
};

module.exports = { auth, isOwner };
