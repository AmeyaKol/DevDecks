// import Flashcard from '../models/Flashcard.js';

// // @desc    Get all flashcards
// // @route   GET /api/flashcards
// // @access  Public
// const getFlashcards = async (req, res) => {
//   try {
//     const flashcards = await Flashcard.find({}).sort({ createdAt: -1 }); // Sort by newest
//     res.status(200).json(flashcards);
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error: Could not fetch flashcards', error: error.message });
//   }
// };

// // @desc    Create a flashcard
// // @route   POST /api/flashcards
// // @access  Public
// const createFlashcard = async (req, res) => {
//   const { question, hint, explanation, code } = req.body;

//   if (!question || !explanation) {
//     return res.status(400).json({ message: 'Question and Explanation are required' });
//   }

//   try {
//     const newFlashcard = new Flashcard({
//       question,
//       hint,
//       explanation,
//       code,
//     });
//     const savedFlashcard = await newFlashcard.save();
//     res.status(201).json(savedFlashcard);
//   } catch (error) {
//      res.status(500).json({ message: 'Server Error: Could not create flashcard', error: error.message });
//   }
// };

// // @desc    Delete a flashcard
// // @route   DELETE /api/flashcards/:id
// // @access  Public
// const deleteFlashcard = async (req, res) => {
//   try {
//     const flashcard = await Flashcard.findById(req.params.id);
//     if (!flashcard) {
//       return res.status(404).json({ message: 'Flashcard not found' });
//     }
//     await flashcard.deleteOne(); // Using deleteOne() as remove() is deprecated
//     res.status(200).json({ message: 'Flashcard removed', id: req.params.id });
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error: Could not delete flashcard', error: error.message });
//   }
// };

// export { getFlashcards, createFlashcard, deleteFlashcard };
// server/controllers/flashcardController.js
import Flashcard from '../models/Flashcard.js';

// @desc    Get all flashcards (public + user's private if authenticated)
// @route   GET /api/flashcards
// @access  Public (but shows more if authenticated)
const getFlashcards = async (req, res) => {
    try {
        let query = { isPublic: true }; // Default: only public flashcards
        
        // If user is authenticated, also include their private flashcards
        if (req.user) {
            query = {
                $or: [
                    { isPublic: true },
                    { user: req.user._id }
                ]
            };
        }

        const flashcards = await Flashcard.find(query)
            .populate('decks', 'name _id')
            .populate('user', 'username')
            .sort({ createdAt: -1 });
        
        res.status(200).json(flashcards);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch flashcards', error: error.message });
    }
};

// @desc    Create a flashcard
// @route   POST /api/flashcards
// @access  Private
const createFlashcard = async (req, res) => {
    const { question, hint, explanation, code, link, type, tags, decks, isPublic } = req.body;

    if (!question || !explanation || !type) {
        return res.status(400).json({ message: 'Question, Explanation, and Type are required' });
    }

    try {
        const newFlashcard = new Flashcard({
            question,
            hint,
            explanation,
            code,
            link,
            type,
            tags: tags || [],
            decks: decks || [],
            user: req.user._id,
            isPublic: isPublic !== undefined ? isPublic : true,
        });

        const savedFlashcard = await newFlashcard.save();
        const populatedFlashcard = await Flashcard.findById(savedFlashcard._id)
            .populate('decks', 'name _id')
            .populate('user', 'username');
        
        res.status(201).json(populatedFlashcard);
    } catch (error) {
        console.error('Error in createFlashcard:', error);
        res.status(500).json({ message: 'Server Error: Could not create flashcard', error: error.message });
    }
};

// @desc    Update a flashcard
// @route   PUT /api/flashcards/:id
// @access  Private (owner only)
const updateFlashcard = async (req, res) => {
    const { question, hint, explanation, code, link, type, tags, decks, isPublic } = req.body;

    try {
        const flashcard = await Flashcard.findById(req.params.id);

        if (!flashcard) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }

        // Check if user owns this flashcard or is admin
        if (flashcard.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this flashcard' });
        }

        if (question !== undefined && question.trim() === '' ||
            explanation !== undefined && explanation.trim() === '' ||
            type !== undefined && type.trim() === '') {
            return res.status(400).json({ message: 'Question, Explanation, and Type cannot be empty if provided' });
        }

        flashcard.question = question !== undefined ? question : flashcard.question;
        flashcard.hint = hint !== undefined ? hint : flashcard.hint;
        flashcard.explanation = explanation !== undefined ? explanation : flashcard.explanation;
        flashcard.code = code !== undefined ? code : flashcard.code;
        flashcard.link = link !== undefined ? link : flashcard.link;
        flashcard.type = type !== undefined ? type : flashcard.type;
        flashcard.tags = tags !== undefined ? tags : flashcard.tags;
        flashcard.decks = decks !== undefined ? decks : flashcard.decks;
        flashcard.isPublic = isPublic !== undefined ? isPublic : flashcard.isPublic;

        const savedFlashcard = await flashcard.save();
        const populatedFlashcard = await Flashcard.findById(savedFlashcard._id)
            .populate('decks', 'name _id')
            .populate('user', 'username');
        
        res.status(200).json(populatedFlashcard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not update flashcard', error: error.message });
    }
};

// @desc    Delete a flashcard
// @route   DELETE /api/flashcards/:id
// @access  Private (owner only)
const deleteFlashcard = async (req, res) => {
    try {
        const flashcard = await Flashcard.findById(req.params.id);
        
        if (!flashcard) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }

        // Check if user owns this flashcard or is admin
        if (flashcard.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this flashcard' });
        }

        await flashcard.deleteOne();
        res.status(200).json({ message: 'Flashcard removed', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not delete flashcard', error: error.message });
    }
};

export { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard };