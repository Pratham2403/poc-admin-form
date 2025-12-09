import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './database/connection.js';
import { attachCSRFToken, verifyCSRFToken } from './utils/csrf.utils.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Limit set to 2mb to accommodate larger form submissions while mitigating DoS risks
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'https://poc-admin-form-1.onrender.com/',
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
