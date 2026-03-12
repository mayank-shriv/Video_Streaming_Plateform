const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');
const { auth } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { validateVideoUpload, validateFileUpload } = require('../middleware/validation');
const AppError = require('../utils/AppError');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'videos');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept video files
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: fileFilter
});

// Upload video
router.post('/',
  auth,
  upload.single('video'),
  validateFileUpload,
  validateVideoUpload,
  asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      // Delete uploaded file if MongoDB is not connected
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw AppError.internal('Database not connected. Please check MongoDB connection and try again.');
    }

    // Handle title and description - ensure they are strings, not arrays
    let title = req.body.title;
    if (Array.isArray(title)) {
      title = title[0] || req.file.originalname;
    }
    title = title || req.file.originalname;

    let description = req.body.description;
    if (Array.isArray(description)) {
      description = description[0] || '';
    }
    description = description || '';

    try {
      const video = new Video({
        title: String(title).trim(),
        description: String(description).trim(),
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: path.relative(path.join(__dirname, '..'), req.file.path),
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploader: req.user._id
      });

      await video.save();
      console.log('Video saved to database:', video._id);
      res.status(201).json(video);
    } catch (error) {
      // Delete uploaded file if save failed
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      throw error;
    }
  })
);

module.exports = router;


