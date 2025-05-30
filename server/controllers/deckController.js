// server/controllers/deckController.js
import Deck from '../models/Deck.js';
import Flashcard from '../models/Flashcard.js'; // Needed to update flashcards if a deck is deleted

// @desc    Create a new deck
// @route   POST /api/decks
// @access  Public (adjust if auth is added)
export const createDeck = async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Deck name is required' });
  }
  try {
    const deckExists = await Deck.findOne({ name });
    if (deckExists) {
      return res.status(400).json({ message: 'Deck with this name already exists' });
    }
    const deck = new Deck({ name, description });
    const createdDeck = await deck.save();
    res.status(201).json(createdDeck);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not create deck', error: error.message });
  }
};

// @desc    Get all decks
// @route   GET /api/decks
// @access  Public
export const getDecks = async (req, res) => {
  try {
    const decks = await Deck.find({}).sort({ name: 1 }); // Sort by name
    res.status(200).json(decks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch decks', error: error.message });
  }
};

// @desc    Get a single deck by ID
// @route   GET /api/decks/:id
// @access  Public
export const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (deck) {
      res.status(200).json(deck);
    } else {
      res.status(404).json({ message: 'Deck not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch deck', error: error.message });
  }
};

// @desc    Update a deck
// @route   PUT /api/decks/:id
// @access  Public
export const updateDeck = async (req, res) => {
  const { name, description } = req.body;
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Check if new name already exists (and it's not the current deck's name)
    if (name && name !== deck.name) {
        const deckExists = await Deck.findOne({ name });
        if (deckExists) {
            return res.status(400).json({ message: 'Another deck with this name already exists' });
        }
    }

    deck.name = name || deck.name;
    deck.description = description !== undefined ? description : deck.description;

    const updatedDeck = await deck.save();
    res.status(200).json(updatedDeck);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not update deck', error: error.message });
  }
};

// @desc    Delete a deck
// @route   DELETE /api/decks/:id
// @access  Public
export const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Remove this deck's ID from all flashcards that reference it
    await Flashcard.updateMany(
      { decks: req.params.id },
      { $pull: { decks: req.params.id } }
    );

    await deck.deleteOne();
    res.status(200).json({ message: 'Deck removed and references updated', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not delete deck', error: error.message });
  }
};