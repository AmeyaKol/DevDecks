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

// @desc    Get all flashcards
// @route   GET /api/flashcards
// @access  Public
const getFlashcards = async (req, res) => {
    try {
        const flashcards = await Flashcard.find({}).sort({ createdAt: -1 });
        res.status(200).json(flashcards);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch flashcards', error: error.message });
    }
};

// @desc    Create a flashcard
// @route   POST /api/flashcards
// @access  Public
const createFlashcard = async (req, res) => {
    const { question, hint, explanation, code, link } = req.body; // Add link

    if (!question || !explanation) {
        return res.status(400).json({ message: 'Question and Explanation are required' });
    }

    try {
        const newFlashcard = new Flashcard({
            question,
            hint,
            explanation,
            code,
            link, // Add link
        });
        const savedFlashcard = await newFlashcard.save();
        res.status(201).json(savedFlashcard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not create flashcard', error: error.message });
    }
};

// @desc    Update a flashcard
// @route   PUT /api/flashcards/:id
// @access  Public
const updateFlashcard = async (req, res) => {
    const { question, hint, explanation, code, link } = req.body;

    try {
        const flashcard = await Flashcard.findById(req.params.id);

        if (!flashcard) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }

        // Basic validation for required fields on update
        if (question === undefined || question.trim() === '' || explanation === undefined || explanation.trim() === '') {
            return res.status(400).json({ message: 'Question and Explanation cannot be empty' });
        }

        flashcard.question = question ?? flashcard.question;
        flashcard.hint = hint ?? flashcard.hint;
        flashcard.explanation = explanation ?? flashcard.explanation;
        flashcard.code = code ?? flashcard.code;
        flashcard.link = link ?? flashcard.link;

        const updatedFlashcard = await flashcard.save();
        res.status(200).json(updatedFlashcard);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not update flashcard', error: error.message });
    }
};


// @desc    Delete a flashcard
// @route   DELETE /api/flashcards/:id
// @access  Public
const deleteFlashcard = async (req, res) => {
    try {
        const flashcard = await Flashcard.findById(req.params.id);
        if (!flashcard) {
            return res.status(404).json({ message: 'Flashcard not found' });
        }
        await flashcard.deleteOne();
        res.status(200).json({ message: 'Flashcard removed', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not delete flashcard', error: error.message });
    }
};

export { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard };