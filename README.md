# Video Streaming Platform

A full-stack video streaming platform built with Node.js, Express, MongoDB, and vanilla HTML/CSS/JavaScript.

## Features

- 📹 Upload videos (up to 500MB)
- 🎬 Stream videos with range request support
- 📊 Video metadata (titlbe, description, views, upload date)
- 🎨 Modern, responsive UI
- 🔄 Real-time upload progress
- 📱 Mobile-friendly design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Project Structure

```
.
├── server.js              # Main Express server
├── models/
│   └── Video.js           # MongoDB video model
├── routes/
│   ├── videoRoutes.js     # Video streaming and listing routes
│   └── uploadRoutes.js    # Video upload routes
├── uploads/
│   └── videos/            # Uploaded video files (created automatically)
├── public/
│   ├── index.html         # Frontend HTML
│   ├── styles.css         # Frontend styles
│   └── script.js          # Frontend JavaScript
└── package.json
```

## API Endpoints

### GET `/api/videos`
Get all videos

### GET `/api/videos/:id`
Get video metadata by ID

### GET `/api/videos/:id/stream`
Stream video with range request support

### POST `/api/upload`
Upload a new video
- Body: multipart/form-data
- Fields: `title`, `description`, `video` (file)

### DELETE `/api/videos/:id`
Delete a video

## Usage

1. **Upload a Video:**
   - Click on "Upload" in the navigation
   - Fill in the title and description
   - Select a video file (max 500MB)
   - Click "Upload Video"
   - Wait for upload to complete

2. **Watch a Video:**
   - Browse videos on the home page
   - Click on any video card to play it
   - Use the back button to return to the home page

## Technologies Used

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB with Mongoose
  - Multer (file upload handling)

- **Frontend:**
  - HTML5
  - CSS3 (with modern features)
  - Vanilla JavaScript (ES6+)

## Notes

- Videos are stored in the `uploads/videos/` directory
- Video metadata is stored in MongoDB
- The streaming endpoint supports HTTP range requests for efficient video playback
- Maximum file size is set to 500MB (can be adjusted in `routes/uploadRoutes.js`)

## License

ISC

