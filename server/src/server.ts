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

const app = express();
const PORT = process.env.PORT || 5000;

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Trust proxy (required for Render/Heroku to detect HTTPS)
app.set("trust proxy", 1);

// Security Headers
app.use(helmet());

// Rate Limiting
app.use("/api", apiRateLimiter);

// Body parsing with limit to mitigate DoS
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// CORS configuration - Only needed in development
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.CLIENT_URL
          ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
          : [];

        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );
}

// CSRF Protection
app.use(attachCSRFToken);
app.use(verifyCSRFToken);

// Connect to Database
connectDB();

// Routes
app.use("/api", routes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  // Serve static files from client/dist
  app.use(express.static(path.join(__dirname, "../../client/dist")));

  // Serve index.html for all non-API routes (SPA fallback)
  // Express 5 requires specific pattern instead of "*"
  app.use((_req, res) => {
    res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.send("API is running...");
  });
}

// 404 handler - only in development (production uses SPA fallback)
if (process.env.NODE_ENV !== "production") {
  app.use(notFoundHandler);
}

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(
    `Server running on port ${PORT} in ${
      process.env.NODE_ENV || "development"
    } mode`
  );
});
