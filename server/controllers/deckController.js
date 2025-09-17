// server/controllers/deckController.js
import Deck from '../models/Deck.js';
import Flashcard from '../models/Flashcard.js'; // Needed to update flashcards if a deck is deleted

// @desc    Create a new deck
// @route   POST /api/decks
// @access  Private
export const createDeck = async (req, res) => {
  const { name, description, type, isPublic } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Deck name is required' });
  }
  if (!type) {
    return res.status(400).json({ message: 'Deck type is required' });
  }
  try {
    // Check if deck with this name already exists for this user
    const deckExists = await Deck.findOne({ name, user: req.user._id });
    if (deckExists) {
      return res.status(400).json({ message: 'You already have a deck with this name' });
    }
    
    const deck = new Deck({ 
      name, 
      description,
      type,
      user: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : true,
    });
    const createdDeck = await deck.save();
    const populatedDeck = await Deck.findById(createdDeck._id).populate('user', 'username');
    res.status(201).json(populatedDeck);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not create deck', error: error.message });
  }
};

// @desc    Get all decks (public + user's private if authenticated)
// @route   GET /api/decks
// @access  Public (but shows more if authenticated)
export const getDecks = async (req, res) => {
  try {
    const { type } = req.query; // Get type filter from query params
    let query = { isPublic: true }; // Default: only public decks
    
    // If user is authenticated, also include their private decks
    if (req.user) {
      query = {
        $or: [
          { isPublic: true },
          { user: req.user._id }
        ]
      };
    }

    // Add type filter if provided
    if (type) {
      query.type = type;
    }

    const decks = await Deck.find(query)
      .populate('user', 'username')
      .sort({ name: 1 });
    res.status(200).json(decks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch decks', error: error.message });
  }
};

// @desc    Get all deck types (for filtering)
// @route   GET /api/decks/types
// @access  Public
export const getDeckTypes = async (req, res) => {
  try {
    const types = ['DSA', 'System Design', 'Behavioral', 'Technical Knowledge', 'Other', 'GRE-Word', 'GRE-MCQ'];
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch deck types', error: error.message });
  }
};

// @desc    Get a single deck by ID
// @route   GET /api/decks/:id
// @access  Public (if public deck) / Private (if private deck and owner)
export const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id).populate('user', 'username');
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Check if deck is public or user owns it
    if (!deck.isPublic && (!req.user || deck.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to view this deck' });
    }

    res.status(200).json(deck);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch deck', error: error.message });
  }
};

// @desc    Update a deck
// @route   PUT /api/decks/:id
// @access  Private (owner only)
export const updateDeck = async (req, res) => {
  const { name, description, type, isPublic } = req.body;
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Check if user owns this deck
    if (deck.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this deck' });
    }

    // Check if new name already exists for this user (and it's not the current deck's name)
    if (name && name !== deck.name) {
        const deckExists = await Deck.findOne({ name, user: req.user._id });
        if (deckExists) {
            return res.status(400).json({ message: 'You already have a deck with this name' });
        }
    }

    deck.name = name || deck.name;
    deck.description = description !== undefined ? description : deck.description;
    deck.type = type || deck.type;
    deck.isPublic = isPublic !== undefined ? isPublic : deck.isPublic;

    const updatedDeck = await deck.save();
    const populatedDeck = await Deck.findById(updatedDeck._id).populate('user', 'username');
    res.status(200).json(populatedDeck);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not update deck', error: error.message });
  }
};

// @desc    Delete a deck
// @route   DELETE /api/decks/:id
// @access  Private (owner only)
export const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Check if user owns this deck
    if (deck.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this deck' });
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

// @desc    Export deck to markdown
// @route   GET /api/decks/:id/export
// @access  Public (if public deck) / Private (if private deck and owner)
export const exportDeckToMarkdown = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id).populate('user', 'username');
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Check if deck is public or user owns it
    if (!deck.isPublic && (!req.user || deck.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to export this deck' });
    }

    // Get all flashcards for this deck
    const flashcards = await Flashcard.find({ decks: req.params.id })
      .populate('user', 'username')
      .sort({ createdAt: 1 });

    // Generate markdown content
    const markdown = generateMarkdownFromDeck(deck, flashcards);

    res.status(200).json({ 
      markdown,
      deckName: deck.name,
      cardCount: flashcards.length,
      exportDate: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not export deck', error: error.message });
  }
};

// Helper function to generate markdown from deck and flashcards
const generateMarkdownFromDeck = (deck, flashcards) => {
  let markdown = `# ${deck.name}\n\n`;
  
  if (deck.description) {
    markdown += `${deck.description}\n\n`;
  }
  
  markdown += `**Deck Type:** ${deck.type}\n`;
  markdown += `**Total Cards:** ${flashcards.length}\n`;
  markdown += `**Export Date:** ${new Date().toLocaleDateString()}\n\n`;
  markdown += `---\n\n`;

  flashcards.forEach((card, index) => {
    markdown += `<details>\n`;
    markdown += `<summary>## Question ${index + 1}: ${card.question}</summary>\n\n`;

    // Add problem statement if it exists
    if (card.problemStatement && card.problemStatement.trim()) {
      markdown += `### Problem Statement\n`;
      markdown += `${card.problemStatement}\n\n`;
    }

    // Add hint if it exists
    if (card.hint && card.hint.trim()) {
      markdown += `### Hint\n`;
      markdown += `> 💡 ${card.hint}\n\n`;
    }

    // Add code if it exists
    if (card.code && card.code.trim()) {
      markdown += `### Code\n`;
      const language = card.language || 'text';
      markdown += `\`\`\`${language}\n${card.code}\n\`\`\`\n\n`;
    }

    // Add explanation
    if (card.explanation && card.explanation.trim()) {
      markdown += `### Explanation\n`;
      markdown += `${card.explanation}\n\n`;
    }

    // Add link if it exists
    if (card.link && card.link.trim()) {
      markdown += `### Reference\n`;
      markdown += `[External Link](${card.link})\n\n`;
    }

    markdown += `</details>\n\n`;
  });

  return markdown;
};