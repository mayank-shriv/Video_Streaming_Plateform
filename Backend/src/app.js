import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        process.env.CORS_ORIGIN,
    ].filter(Boolean),
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"));

app.use(cookieParser());

// --- Health Check ---
app.get("/api/v1/healthcheck", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Video Streaming Platform API is running 🚀",
        timestamp: new Date().toISOString(),
    });
});

// --- API Routes ---
import userRoutes from "./routes/user.routes.js";
import videoRoutes from "./routes/video.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import likeRoutes from "./routes/like.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/videos", videoRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/likes", likeRoutes);
app.use("/api/v1/subscriptions", subscriptionRoutes);
app.use("/api/v1/playlists", playlistRoutes);

// --- Serve React Frontend (production build) ---
const reactBuildPath = path.join(__dirname, "../../Frontend/dist");
app.use(express.static(reactBuildPath));

// --- SPA catch-all: serve index.html for client-side routing ---
app.get(/.*/, (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(reactBuildPath, "index.html"));
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

export { app };