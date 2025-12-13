import mongoose from 'mongoose';
import dotenv from 'dotenv';

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
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        
        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected successfully');
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed through app termination');
                process.exit(0);
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
                process.exit(1);
            }
        });
        
        return conn;
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        
        // In production, don't exit immediately - allow for retry logic
        if (process.env.NODE_ENV === 'production') {
            console.error('Retrying connection in 5 seconds...');
            setTimeout(() => connectDB(), 5000);
        } else {
            process.exit(1);
        }
    }
};

export default connectDB;