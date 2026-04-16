import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({
    extended: true,
    limit: "16kb"
}));

app.use(express.static("public"));

app.use(cookieParser());

// --- API Routes ---
import userRoutes from "./routes/user.routes.js";
app.use("/api/v1/user", userRoutes);

// --- Serve Frontend ---
const frontendPath = path.join(__dirname, "../../Frontend");
app.use(express.static(frontendPath));

export { app };