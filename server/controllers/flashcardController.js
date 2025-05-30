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
// const createFlashcard = async (req, res) => {
//     const { question, hint, explanation, code, link, type, tags, decks } = req.body;

//     if (!question || !explanation || !type) { // Type is now required
//         return res.status(400).json({ message: 'Question, Explanation, and Type are required' });
//     }

//     try {
//         const newFlashcard = new Flashcard({
//             question,
//             hint,
//             explanation,
//             code,
//             link,
//             type,
//             tags: tags || [],       // Ensure tags is an array
//             decks: decks || [],     // Ensure decks is an array of ObjectIds
//         });
//         const savedFlashcard = await newFlashcard.save();
//         // Optionally populate decks for the response, so client has names
//         const populatedFlashcard = await Flashcard.findById(savedFlashcard._id).populate('decks', 'name _id');
//         res.status(201).json(populatedFlashcard);
//     } catch (error) {
//         res.status(500).json({ message: 'Server Error: Could not create flashcard', error: error.message });
//     }
// };

const createFlashcard = async (req, res) => {
    console.log('--- createFlashcard Controller Hit ---'); // <--- ADD THIS
    console.log('Request Body:', req.body); // <--- ADD THIS

    const { question, hint, explanation, code, link, type, tags, decks } = req.body;

    if (!question || !explanation || !type) {
        console.log('Validation Error: Question, Explanation, or Type missing'); // <--- ADD THIS
        return res.status(400).json({ message: 'Question, Explanation, and Type are required' });
    }

    try {
        console.log('Attempting to create new Flashcard model instance...'); // <--- ADD THIS
        const newFlashcard = new Flashcard({
            question,
            hint,
            explanation,
            code,
            link,
            type,
            tags: tags || [],
            decks: decks || [],
        });
        console.log('Flashcard instance created, attempting to save...'); // <--- ADD THIS
        const savedFlashcard = await newFlashcard.save();
        console.log('Flashcard saved successfully:', savedFlashcard._id); // <--- ADD THIS

        // Populate decks before sending response
        const populatedFlashcard = await Flashcard.findById(savedFlashcard._id).populate('decks', 'name _id');
        console.log('Sending 201 response with populated flashcard.'); // <--- ADD THIS
        res.status(201).json(populatedFlashcard);

    } catch (error) {
        console.error('!!! Error in createFlashcard !!!', error); // <--- MODIFY THIS to log the full error
        res.status(500).json({ message: 'Server Error: Could not create flashcard', error: error.message });
    }
};

// @desc    Update a flashcard
// @route   PUT /api/flashcards/:id
// @access  Public
const updateFlashcard = async (req, res) => {
    const { question, hint, explanation, code, link, type, tags, decks } = req.body;

    try {
        const flashcard = await Flashcard.findById(req.params.id);

        if (!flashcard) {
            return res.status(404).json({ message: 'Flashcard not found' });
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
        flashcard.decks = decks !== undefined ? decks : flashcard.decks; // Expecting an array of ObjectIds

        const savedFlashcard = await flashcard.save();
        const populatedFlashcard = await Flashcard.findById(savedFlashcard._id).populate('decks', 'name _id');
        res.status(200).json(populatedFlashcard);
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