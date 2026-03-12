# MayankTube 🎬

A premium YouTube-like video streaming platform built with modern web technologies.

## Features

- 🎥 **Video Upload & Streaming** - Upload and watch videos
- 🎨 **YouTube Dark Theme** - Premium dark mode UI
- 🎬 **Theater Mode** - Immersive viewing experience
- 📺 **Mini Player / PiP** - Picture-in-picture support
- ⚡ **Speed Controls** - Adjust playback speed (0.25x - 2x)
- 🔗 **Social Sharing** - Share to Twitter, Facebook, WhatsApp
- 💬 **Comments System** - Engage with content
- ❤️ **Like/Dislike** - Animated feedback
- 🔔 **Subscribe** - Follow content creators
- ⏸️ **Resume Playback** - Videos remember your position

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcrypt
- **Frontend**: Vanilla JavaScript, CSS3
- **File Upload**: Multer
- **Security**: Helmet, CORS, Rate Limiting

## Prerequisites

- Node.js >= 18.0.0
- MongoDB database (local or MongoDB Atlas)
- npm >= 9.0.0

## Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd VideoStreamingPlateform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# MongoDB Connection
MONGODB_URI=your_mongodb_connection_string

# JWT Secret (use a strong random string)
JWT_SECRET=your_jwt_secret_key_here

# Server Port
PORT=3000
```

4. **Run the application**

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Deployment on Render

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: mayanktube
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `JWT_SECRET` - Your secret key
   - `PORT` - Leave default (Render sets this automatically)
6. Click "Create Web Service"

### MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist Render's IP (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and add to Render environment variables

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Secret key for JWT token generation | Yes |
| `PORT` | Server port (default: 3000) | No |

## Project Structure

```
VideoStreamingPlateform/
├── middleware/          # Auth middleware
├── models/             # MongoDB models (User, Video)
├── public/             # Frontend files
│   ├── index.html     # Main HTML
│   ├── styles.css     # Styling
│   └── script.js      # Client-side JavaScript
├── routes/            # API routes
│   ├── authRoutes.js  # Authentication
│   ├── videoRoutes.js # Video operations
│   └── uploadRoutes.js # File uploads
├── uploads/           # Uploaded video files (gitignored)
├── server.js          # Express server
├── package.json       # Dependencies
└── .env              # Environment variables (gitignored)
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get single video
- `GET /api/videos/:id/stream` - Stream video
- `DELETE /api/videos/:id` - Delete video (auth required)

### Upload
- `POST /api/upload` - Upload video (auth required)

## Security Features

- Helmet.js for HTTP headers security
- CORS protection
- Rate limiting on API routes
- JWT authentication
- Password hashing with bcrypt
- Input validation

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

## License

MIT

## Author

Mayank

---

**Note**: Make sure to keep your `.env` file secure and never commit it to GitHub!
