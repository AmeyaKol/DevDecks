import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Flashcard from '../models/Flashcard.js';
import Deck from '../models/Deck.js';

dotenv.config();

const migrateData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Create admin user
        let adminUser = await User.findOne({ username: 'admin' });
        if (!adminUser) {
            adminUser = await User.create({
                username: 'admin',
                email: 'admin@flashcards.com',
                password: 'admin123', // Change this to a secure password
                isAdmin: true,
            });
            console.log('Admin user created');
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
        process.exit(1);
    }
};

migrateData(); 