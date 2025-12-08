import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectDB } from './database/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Limit set to 2mb to accommodate larger form submissions while mitigating DoS risks
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

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
