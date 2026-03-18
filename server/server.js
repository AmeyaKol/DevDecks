import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import connectDB from './config/db.js';
import { assignRequestId, requestLogger } from './middleware/requestLogger.js';
import usageTracker from './middleware/usageTracker.js';
import { getMetricsSnapshot } from './services/usageMetrics.js';
import { protect } from './middleware/authMiddleware.js';
import { adminOnly } from './middleware/adminMiddleware.js';
import logger from './utils/logger.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import deckRoutes from './routes/deckRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dictionaryRoutes from './routes/dictionaryRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';

dotenv.config();

if (process.env.NODE_ENV !== 'test') {
    connectDB();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = YAML.load(path.join(__dirname, 'docs', 'openapi.yaml'));

// Set default JWT secret if not provided
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'your-secret-key-change-in-production';
    console.warn('Warning: Using default JWT_SECRET. Set JWT_SECRET in .env file for production.');
}

const app = express();

// Trust proxy - required when behind a reverse proxy (Render, Heroku, AWS, etc.)
// This enables Express to correctly read X-Forwarded-* headers for rate limiting and IP detection
app.set('trust proxy', 1);

// Request ID + structured logging
app.use(assignRequestId);
app.use(requestLogger);
app.use(usageTracker);

// Security middleware - HTTP headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://devdecks.vercel.app',
            'https://devdecks.onrender.com',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow Chrome extension origins
        if (origin && origin.startsWith('chrome-extension://')) {
            console.log(`Allowing Chrome extension origin: ${origin}`);
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Compression middleware - compress all responses
app.use(compression({
    level: 6, // Balanced compression level
    threshold: 1024, // Only compress responses larger than 1KB
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Skip rate limiting entirely in local development to avoid
// false-positive 429s from multiple components calling the same
// endpoints on mount / hot-reload.
const isDev = process.env.NODE_ENV !== 'production';

// Rate limiting configuration
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    skip: () => isDev,
    message: {
        error: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limit for authentication routes
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 login/register attempts per hour
    skip: () => isDev,
    message: {
        error: 'Too many authentication attempts, please try again after an hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// More lenient rate limit for read operations
const readLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // Limit each IP to 60 read requests per minute
    skip: () => isDev,
    message: {
        error: 'Too many requests, please slow down'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply general rate limiting to all requests
app.use('/api/', generalLimiter);

// Apply stricter rate limiting to auth routes
app.use('/api/users/login', authLimiter);
app.use('/api/users/register', authLimiter);

// Apply read limiter to GET requests on main data routes
app.use('/api/flashcards', (req, res, next) => {
    if (req.method === 'GET') {
        return readLimiter(req, res, next);
    }
    next();
});
app.use('/api/decks', (req, res, next) => {
    if (req.method === 'GET') {
        return readLimiter(req, res, next);
    }
    next();
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API documentation (Swagger UI)
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Basic usage metrics (admin only)
app.get('/api/metrics', protect, adminOnly, (req, res) => {
    res.status(200).json(getMetricsSnapshot());
});

// API Routes
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/decks', deckRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/users', userRoutes);
app.use('/api', dictionaryRoutes);
app.use('/api/youtube', youtubeRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        message: err.message,
        stack: err.stack,
    });
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
        return res.status(400).json({ 
            message: 'Validation Error', 
            errors: err.errors 
        });
    }
    
    if (err.name === 'CastError') {
        return res.status(400).json({ 
            message: 'Invalid ID format' 
        });
    }
    
    if (err.code === 11000) {
        return res.status(400).json({ 
            message: 'Duplicate key error' 
        });
    }
    
    // Default error response
    res.status(err.status || 500).json({
        message: process.env.NODE_ENV === 'production' 
            ? 'Something went wrong!' 
            : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}

export default app;