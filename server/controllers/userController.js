import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user exists
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            return res.status(400).json({ 
                message: userExists.email === email ? 'Email already registered' : 'Username already taken' 
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                favorites: user.favorites,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user email
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                problemsCompleted: user.problemsCompleted,
                favorites: user.favorites,
                recents: user.recents,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                problemsCompleted: user.problemsCompleted,
                favorites: user.favorites,
                recents: user.recents,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error getting profile', error: error.message });
    }
};

// @desc    Update problems completed for a user
// @route   POST /api/users/problems-completed
// @access  Private
export const updateProblemsCompleted = async (req, res) => {
    const { problemId, completed } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            if (completed) {
                // Add problemId (string) to the array if it's not already there
                if (!user.problemsCompleted.includes(problemId)) {
                    user.problemsCompleted.push(problemId);
                }
            } else {
                // Remove problemId (string) from the array
                user.problemsCompleted = user.problemsCompleted.filter(
                    (id) => id !== problemId
                );
            }

            const updatedUser = await user.save();

            res.json({
                problemsCompleted: updatedUser.problemsCompleted,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error updating completed problems', error: error.message });
    }
};

// @desc    Add deck to favorites
// @route   POST /api/users/favorites/add
// @access  Private
export const addToFavorites = async (req, res) => {
    const { deckId } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Add deckId to favorites if it's not already there
            if (!user.favorites.includes(deckId)) {
                user.favorites.push(deckId);
                const updatedUser = await user.save();
                res.json({
                    favorites: updatedUser.favorites,
                    message: 'Deck added to favorites'
                });
            } else {
                res.status(400).json({ message: 'Deck is already in favorites' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error adding to favorites', error: error.message });
    }
};

// @desc    Remove deck from favorites
// @route   POST /api/users/favorites/remove
// @access  Private
export const removeFromFavorites = async (req, res) => {
    const { deckId } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Remove deckId from favorites
            user.favorites = user.favorites.filter(
                (id) => id.toString() !== deckId
            );
            const updatedUser = await user.save();
            res.json({
                favorites: updatedUser.favorites,
                message: 'Deck removed from favorites'
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error removing from favorites', error: error.message });
    }
}; 

// @desc    Update recent decks for a user (LRU cache)
// @route   POST /api/users/recent-deck
// @access  Private
export const updateRecentDecks = async (req, res) => {
    const { deckId } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            // Remove existing entry if it exists
            user.recents = user.recents.filter(
                (recent) => recent.deckId.toString() !== deckId
            );

            // Add to front with current timestamp
            user.recents.unshift({
                deckId: deckId,
                lastAccessed: new Date()
            });

            // Keep only the 10 most recent
            if (user.recents.length > 10) {
                user.recents = user.recents.slice(0, 10);
            }

            const updatedUser = await user.save();

            res.json({
                recents: updatedUser.recents,
                message: 'Recent decks updated successfully'
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error updating recent decks', error: error.message });
    }
}; 