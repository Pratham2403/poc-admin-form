import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
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
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
        : [];

      if (process.env.NODE_ENV !== "production") {
        allowedOrigins.push("http://localhost:3000");
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
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

// Routes
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.send("API is running...");
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
