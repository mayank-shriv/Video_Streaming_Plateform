const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/videostreaming';

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  
  if (err.message.includes('authentication failed') || err.message.includes('bad auth')) {
    console.log('\n🔐 Authentication Failed - Check these:');
    console.log('   1. Verify your password in .env file is correct');
    console.log('   2. If password has special characters, URL encode them:');
    console.log('      @ → %40, # → %23, $ → %24, & → %26, + → %2B, / → %2F');
    console.log('   3. Make sure the database user exists in MongoDB Atlas');
    console.log('   4. Check Network Access in Atlas - add your IP (or 0.0.0.0/0 for all)');
    console.log('   5. Verify username is correct in connection string\n');
  } else if (err.message.includes('ECONNREFUSED')) {
    console.log('\n📝 Connection Refused - MongoDB not running:');
    console.log('   1. For local: Start MongoDB service or run: mongod');
    console.log('   2. For Atlas: Check network access settings\n');
  } else {
    console.log('\n📝 To fix this issue:');
    console.log('   1. Check your .env file has correct MONGODB_URI');
    console.log('   2. Verify MongoDB Atlas cluster is running');
    console.log('   3. Check network access in MongoDB Atlas dashboard\n');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({
    status: dbStatus === 1 ? 'ok' : 'error',
    database: dbStates[dbStatus] || 'unknown',
    message: dbStatus === 1 ? 'MongoDB is connected' : 'MongoDB is not connected'
  });
});

// Routes
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

