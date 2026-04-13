import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

// MongoDB connection options optimized for production
const mongoOptions = {
    // Connection pool settings
    maxPoolSize: 10, // Maximum number of sockets in the connection pool
    minPoolSize: 2,  // Minimum number of sockets in the connection pool
    
    // Timeouts
    serverSelectionTimeoutMS: 5000, // Timeout for server selection
    socketTimeoutMS: 45000, // Timeout for socket operations
    
    // Heartbeat
    heartbeatFrequencyMS: 10000, // Frequency of heartbeat checks
    
    // Retry settings
    retryWrites: true,
    retryReads: true,
    
    // Write concern
    w: 'majority',
};

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);
        
        const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!mongoUri) {
            throw new Error('MongoDB URI not found in environment variables. Please set MONGO_URI or MONGODB_URI.');
        }
        
        const conn = await mongoose.connect(mongoUri, mongoOptions);
        
        logger.info('MongoDB connected', {
            host: conn.connection.host,
            database: conn.connection.name,
            environment: process.env.NODE_ENV || 'development',
        });
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error', { message: err.message, stack: err.stack });
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected; attempting to reconnect');
        });
        
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                logger.info('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                logger.error('Error closing MongoDB connection', { message: err.message });
                process.exit(1);
            }
        });
        
        return conn;
    } catch (error) {
        logger.error('Error connecting to MongoDB', { message: error.message });
        
        // In production, don't exit immediately - allow for retry logic
        if (process.env.NODE_ENV === 'production') {
            logger.warn('Retrying MongoDB connection in 5 seconds');
            setTimeout(() => connectDB(), 5000);
        } else {
            process.exit(1);
        }
    }
};

export default connectDB;