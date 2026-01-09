const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const fs = require('fs');
const path = require('path');

// Get all videos
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        error: 'Database not connected',
        videos: []
      });
    }
    
    const videos = await Video.find().sort({ uploadDate: -1 });
    
    // Filter out videos with missing files
    const validVideos = [];
    const orphanedIds = [];
    
    for (const video of videos) {
      const videoPath = path.join(__dirname, '..', video.path);
      if (fs.existsSync(videoPath)) {
        validVideos.push(video);
      } else {
        orphanedIds.push(video._id);
        console.log(`Found orphaned video: ${video._id} - file missing: ${video.path}`);
      }
    }
    
    // Auto-cleanup orphaned videos (optional - can be disabled)
    if (orphanedIds.length > 0) {
      console.log(`Cleaning up ${orphanedIds.length} orphaned video records...`);
      await Video.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`Cleaned up ${orphanedIds.length} orphaned videos`);
    }
    
    console.log(`Found ${validVideos.length} valid videos in database`);
    res.json(validVideos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single video by ID
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Increment views
    video.views += 1;
    await video.save();
    
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stream video
router.get('/:id/stream', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const videoPath = path.join(__dirname, '..', video.path);
    
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video
router.delete('/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup endpoint - remove videos with missing files
router.post('/cleanup', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
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
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

