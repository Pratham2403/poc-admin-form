import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./database/connection.ts";
import { attachCSRFToken, verifyCSRFToken } from "./utils/csrf.utils.ts";
import { apiRateLimiter } from "./middlewares/ratelimit.middleware.ts";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.ts";
import logger from "./lib/logger/index.ts";
import routes from "./routes/index.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (required for Render/Heroku to detect HTTPS)
app.set("trust proxy", 1);

// Security Headers
app.use(helmet());

// Rate Limiting
app.use("/api", apiRateLimiter);

// Body parsing with limit to mitigate DoS
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, same-origin)
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
        : [];

      // // In development, allow localhost
      // if (process.env.NODE_ENV !== "production") {
      //   allowedOrigins.push("http://localhost:3000");
      // }

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        allowedOrigins.length === 0
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// CSRF Protection
app.use(attachCSRFToken);
app.use(verifyCSRFToken);

// Connect to Database
connectDB();

// Serve static files from React frontend (only in production)
if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientDistPath));
  logger.info(`Serving static files from: ${clientDistPath}`);
}

// API Routes
app.use("/api", routes);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// Serve React app for any other route (must be after API routes)
// This enables client-side routing
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    // If request is not for /api or /health, serve the React app
    if (!req.path.startsWith("/api") && req.path !== "/health") {
      res.sendFile(path.join(__dirname, "../../client/dist/index.html"));
    } else {
      next();
    }
  });
} else {
  // In development, show API status
  app.get("/", (_req, res) => {
    res.send("API is running in development mode...");
  });
}

// 404 handler for API routes only (in dev mode)
if (process.env.NODE_ENV !== "production") {
  app.use(notFoundHandler);
}

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
