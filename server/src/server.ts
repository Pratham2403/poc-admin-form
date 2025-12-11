import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './database/connection.js';
import { attachCSRFToken, verifyCSRFToken } from './utils/csrf.utils.js';
import helmet from 'helmet';
import { apiRateLimiter } from './middlewares/ratelimit.middleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy (required for Render/Heroku to detect HTTPS)
app.set('trust proxy', 1);

// Middleware


// Security Headers
app.use(helmet());

// Rate Limiting
app.use('/api', apiRateLimiter);

// Limit set to 2mb to accommodate larger form submissions while mitigating DoS risks
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        const allowedOrigins = process.env.CLIENT_URL
            ? process.env.CLIENT_URL.split(',').map(url => url.trim())
            : []; // No default fallbacks in production for security. Set CLIENT_URL!

        if (process.env.NODE_ENV !== 'production') {
            // Allow localhost in dev
            allowedOrigins.push('http://localhost:3000');
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// CSRF Protection: Attach token to all requests, verify on state-changing methods
app.use(attachCSRFToken);
app.use(verifyCSRFToken);

// Connect to Database
connectDB();

import routes from './routes/index.js';
app.use('/api', routes);

// Routes
app.get('/', (req, res) => {
    res.send('API is running...');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
