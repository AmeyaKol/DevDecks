import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User.js';
import Flashcard from '../models/Flashcard.js';
import Deck from '../models/Deck.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the server directory
dotenv.config({ path: join(__dirname, '../.env') });

const migrateData = async () => {
    try {
        // Use environment variable or fallback to default local MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/flashcards';
        
        console.log('Attempting to connect to MongoDB...');
        console.log('MongoDB URI:', mongoUri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in log
        
        // Connect to MongoDB
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully');

        // Create admin user
        let adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            adminUser = await User.create({
                username: 'admin',
                email: 'admin@flashcards.com',
                password: 'admin123', // Change this to a secure password
                isAdmin: true,
            });
            console.log('Admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }

        // Update all existing flashcards to be owned by admin and public
        const flashcardUpdateResult = await Flashcard.updateMany(
            { user: { $exists: false } }, // Only update cards without user field
            { 
                user: adminUser._id,
                isPublic: true 
            }
        );
        console.log(`Updated ${flashcardUpdateResult.modifiedCount} flashcards`);

        // Update all existing decks to be owned by admin and public
        const deckUpdateResult = await Deck.updateMany(
            { user: { $exists: false } }, // Only update decks without user field
            { 
                user: adminUser._id,
                isPublic: true 
            }
        );
        console.log(`Updated ${deckUpdateResult.modifiedCount} decks`);

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        console.error('Error details:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.error('\n❌ MongoDB connection refused. Please ensure:');
            console.error('1. MongoDB is running on your system');
            console.error('2. The MONGO_URI in your .env file is correct');
            console.error('3. If using MongoDB Atlas, check your network access and credentials');
        }
        
        process.exit(1);
    }
};

migrateData(); 