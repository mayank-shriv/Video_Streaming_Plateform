/**
 * server.js
 * Video Streaming Platform Backend
 */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dns = require("dns");
require("dotenv").config();

/* ---------------- DNS FIX (IMPORTANT FOR WINDOWS + ATLAS) ---------------- */
dns.setDefaultResultOrder("ipv4first");

/* ---------------- APP INIT ---------------- */
const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- SECURITY & CORE MIDDLEWARE ---------------- */
app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https:"],
        "script-src": ["'self'", "https://fonts.googleapis.com"],
        "media-src": ["'self'", "blob:", "data:"],
      },
    },
  })
);

app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- RATE LIMITING ---------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

/* ---------------- STATIC FILES ---------------- */
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- MONGOOSE CONFIG ---------------- */
mongoose.set("strictQuery", true);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/videostreaming";

// Mask password for logs
const maskedUri = MONGODB_URI.replace(/:([^@]+)@/, ":****@");
console.log(`📡 Attempting to connect to: ${maskedUri}`);

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);

    if (err.message.includes("ENOTFOUND")) {
      console.log("\n🧠 ROOT CAUSE:");
      console.log("   → Invalid MongoDB Atlas hostname");
      console.log("   → Re-copy SRV string from Atlas > Connect > Drivers\n");
    }

    if (err.message.includes("authentication failed")) {
      console.log("🔐 AUTH ERROR:");
      console.log("   → Wrong username/password");
      console.log("   → Password not URL-encoded\n");
    }

    if (err.message.includes("ECONNREFUSED")) {
      console.log("🚫 CONNECTION REFUSED:");
      console.log("   → MongoDB not reachable");
      console.log("   → Check Atlas Network Access (0.0.0.0/0)\n");
    }
  });

/* ---------------- HEALTH CHECK ---------------- */
app.get("/api/health", (req, res) => {
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const state = mongoose.connection.readyState;

  res.json({
    status: state === 1 ? "ok" : "error",
    database: states[state],
  });
});

/* ---------------- API ROUTES ---------------- */
app.use("/api/videos", require("./routes/videoRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

/* ---------------- FRONTEND FALLBACK ---------------- */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ---------------- GLOBAL ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal Server Error" });
});

/* ---------------- SERVER START ---------------- */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
