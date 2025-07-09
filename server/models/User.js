import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required'],
            unique: true,
            trim: true,
            minlength: [3, 'Username must be at least 3 characters'],
            maxlength: [20, 'Username cannot exceed 20 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
        },
        problemsCompleted: {
            type: [{
                type: String,
            }],
            default: [],
        },
        favorites: {
            type: [{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Deck'
            }],
            default: [],
        },
        recents: {
            type: [{
                deckId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Deck',
                    required: true
                },
                lastAccessed: {
                    type: Date,
                    default: Date.now
                }
            }],
            default: [],
            validate: [function(arr) { return arr.length <= 10; }, 'Recents array cannot exceed 10 items']
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User; 