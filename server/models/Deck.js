// server/models/Deck.js
import mongoose from 'mongoose';
import { FIELD_TYPES, FIELD_ROLES, MAX_CUSTOM_FIELDS, resolveFieldConfig } from '../services/fieldConfigService.js';

// A single field definition within a Custom deck's fieldConfig. `name` is an
// identifier (used as the fieldData key); `displayName` is what the user sees.
const fieldDefSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            match: [/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Field name must start with a letter and contain only letters, numbers, and underscores'],
        },
        displayName: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: FIELD_TYPES,
        },
        role: {
            type: String,
            required: true,
            enum: FIELD_ROLES,
            default: 'answer',
        },
        required: {
            type: Boolean,
            default: false,
        },
        order: {
            type: Number,
            required: true,
        },
        placeholder: {
            type: String,
            default: '',
        },
        // Only meaningful for `code` fields.
        language: {
            type: String,
            enum: ['python', 'cpp', 'java', 'javascript'],
        },
        // Only meaningful for `mcq` fields.
        mcqType: {
            type: String,
            enum: ['single-correct', 'multiple-correct'],
            default: 'single-correct',
        },
        // Per-field presentation styling ("style content" decision) -- not a
        // 7th field type, just how the renderer emphasizes this field.
        style: {
            type: String,
            enum: ['plain', 'callout', 'accent'],
            default: 'plain',
        },
    },
    { _id: false }
);

const fieldConfigSchema = new mongoose.Schema(
    {
        fields: {
            type: [fieldDefSchema],
            default: [],
            validate: {
                validator: (fields) => fields.length <= MAX_CUSTOM_FIELDS,
                message: `A Custom deck supports at most ${MAX_CUSTOM_FIELDS} fields`,
            },
        },
    },
    { _id: false }
);

const deckSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Deck name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        // New "Type" property for deck categorization
        type: {
            type: String,
            required: [true, 'Please specify a type for the deck'],
            enum: ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ', 'Custom'],
            default: 'DSA',
        },
        // Per-field schema for Custom decks. Named types leave this empty and
        // resolve their field list from the standard template at read time
        // (see fieldConfigService.resolveFieldConfig) -- no migration needed.
        fieldConfig: {
            type: fieldConfigSchema,
            default: () => ({ fields: [] }),
        },
        // User ownership and privacy
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        isPublic: {
            type: Boolean,
            default: true,
        },
        // We won't store flashcard IDs directly in the deck model.
        // Instead, the Flashcard model will store an array of deck IDs it belongs to.
        // This makes a many-to-many relationship easier if a flashcard can be in multiple decks.
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Enforce unique field `name`s and unique `order`s within a Custom deck's fieldConfig.
deckSchema.pre('save', function preSave(next) {
    if (this.type === 'Custom' && this.isModified('fieldConfig') && this.fieldConfig?.fields?.length) {
        const names = this.fieldConfig.fields.map((f) => f.name);
        if (new Set(names).size !== names.length) {
            return next(new Error('Custom deck field names must be unique'));
        }
        const orders = this.fieldConfig.fields.map((f) => f.order);
        if (new Set(orders).size !== orders.length) {
            return next(new Error('Custom deck field orders must be unique'));
        }
    }
    next();
});

// Actually resolves the effective field list (standard template inferred for
// legacy/named decks, null for GRE types) -- unlike a virtual that just
// echoes back the unresolved fieldConfig.
deckSchema.virtual('resolvedFieldConfig').get(function resolvedFieldConfigGetter() {
    return resolveFieldConfig(this);
});

// Ensure deck names are unique per user
deckSchema.index({ name: 1, user: 1 }, { unique: true });

// Indexes for query optimization
// Index for fetching decks by user
deckSchema.index({ user: 1, createdAt: -1 });

// Index for fetching public decks
deckSchema.index({ isPublic: 1, name: 1 });

// Index for filtering by type
deckSchema.index({ type: 1, isPublic: 1 });

// Compound index for common query pattern: visibility + type
deckSchema.index({ isPublic: 1, type: 1, name: 1 });

// Text index for search functionality
deckSchema.index({ 
    name: 'text', 
    description: 'text' 
}, {
    weights: {
        name: 10,
        description: 1
    },
    name: 'deck_text_search'
});

const Deck = mongoose.model('Deck', deckSchema);
export default Deck;