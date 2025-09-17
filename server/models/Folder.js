// server/models/Folder.js
import mongoose from 'mongoose';

const folderSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Folder name is required'],
            trim: true,
            maxlength: [100, 'Folder name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            default: '',
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        // User ownership
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        // Array of deck IDs that belong to this folder
        decks: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Deck',
        }],
        // Privacy setting
        isPublic: {
            type: Boolean,
            default: false, // Folders are private by default
        },
    },
    {
        timestamps: true,
    }
);

// Ensure folder names are unique per user
folderSchema.index({ name: 1, user: 1 }, { unique: true });

// Add virtual for deck count
folderSchema.virtual('deckCount').get(function() {
    return this.decks ? this.decks.length : 0;
});

// Ensure virtual fields are serialized
folderSchema.set('toJSON', { virtuals: true });
folderSchema.set('toObject', { virtuals: true });

const Folder = mongoose.model('Folder', folderSchema);
export default Folder;




