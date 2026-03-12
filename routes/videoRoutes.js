const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');
const { auth, isOwner } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { validateVideoId } = require('../middleware/validation');
const AppError = require('../utils/AppError');

// Get all videos with pagination and search
router.get('/', asyncHandler(async (req, res) => {
  const { sort, search, page = 1, limit = 20 } = req.query;

  // Check if MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    throw AppError.internal('Database not connected');
  }

  let query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  let sortOptions = { uploadDate: -1 };
  if (sort === 'trending') {
    sortOptions = { views: -1, uploadDate: -1 };
  } else if (sort === 'oldest') {
    sortOptions = { uploadDate: 1 };
  } else if (sort === 'alphabetical') {
    sortOptions = { title: 1 };
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const videos = await Video.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Video.countDocuments(query);

  res.json({
    videos,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

// Get single video by ID
router.get('/:id', validateVideoId, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw AppError.notFound('Video not found');
  }

  // Increment views (fire and forget for better performance)
  Video.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec();

  res.json(video);
}));

// Stream video
router.get('/:id/stream', validateVideoId, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw AppError.notFound('Video not found');
  }

  const videoPath = path.join(__dirname, '..', video.path);

  if (!fs.existsSync(videoPath)) {
    throw AppError.notFound('Video file not found');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': video.mimetype,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': video.mimetype,
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
}));

// Delete video
router.delete('/:id', auth, validateVideoId, isOwner, asyncHandler(async (req, res) => {
  const video = await Video.findById(req.params.id);

  if (!video) {
    throw AppError.notFound('Video not found');
  }

  // Delete file from filesystem
  const videoPath = path.join(__dirname, '..', video.path);
  if (fs.existsSync(videoPath)) {
    fs.unlinkSync(videoPath);
    console.log(`Deleted video file: ${videoPath}`);
  } else {
    console.log(`Video file already missing: ${videoPath}`);
  }

  await Video.findByIdAndDelete(req.params.id);
  console.log(`Deleted video record: ${req.params.id}`);

  res.json({ message: 'Video deleted successfully' });
}));

// Cleanup endpoint - remove videos with missing files (admin only)
router.post('/cleanup', asyncHandler(async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    throw AppError.internal('Database not connected');
  }

  const videos = await Video.find();
  const orphanedIds = [];

  for (const video of videos) {
    const videoPath = path.join(__dirname, '..', video.path);
    if (!fs.existsSync(videoPath)) {
      orphanedIds.push(video._id);
    }
  }

  if (orphanedIds.length > 0) {
    await Video.deleteMany({ _id: { $in: orphanedIds } });
    res.json({
      message: `Cleaned up ${orphanedIds.length} orphaned video records`,
      deleted: orphanedIds.length
    });
  } else {
    res.json({
      message: 'No orphaned videos found',
      deleted: 0
    });
  }
}));

module.exports = router;


