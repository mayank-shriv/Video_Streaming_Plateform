const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Video = require('../models/Video');

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
router.post('/', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      // Delete uploaded file if MongoDB is not connected
      const filePath = req.file.path;
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(503).json({ 
        error: 'Database not connected. Please check MongoDB connection and try again.' 
      });
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

    const video = new Video({
      title: String(title).trim(),
      description: String(description).trim(),
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: path.relative(path.join(__dirname, '..'), req.file.path),
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    await video.save();
    console.log('Video saved to database:', video._id);
    res.status(201).json(video);
  } catch (error) {
    console.error('Upload error:', error);
    // Delete uploaded file if save failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

