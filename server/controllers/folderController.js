// server/controllers/folderController.js
import Folder from '../models/Folder.js';
import Deck from '../models/Deck.js';

// @desc    Create a new folder
// @route   POST /api/folders
// @access  Private
export const createFolder = async (req, res) => {
  const { name, description, isPublic } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Folder name is required' });
  }
  
  try {
    // Check if folder with this name already exists for this user
    const folderExists = await Folder.findOne({ name, user: req.user._id });
    if (folderExists) {
      return res.status(400).json({ message: 'You already have a folder with this name' });
    }
    
    const folder = new Folder({ 
      name, 
      description: description || '',
      user: req.user._id,
      isPublic: isPublic !== undefined ? isPublic : false,
      decks: []
    });
    
    const createdFolder = await folder.save();
    const populatedFolder = await Folder.findById(createdFolder._id)
      .populate('user', 'username')
      .populate('decks', 'name description type isPublic');
    
    res.status(201).json(populatedFolder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not create folder', error: error.message });
  }
};

// @desc    Get all folders (public + user's private if authenticated)
// @route   GET /api/folders
// @access  Public (but shows more if authenticated)
export const getFolders = async (req, res) => {
  try {
    let query = {};
    
    // If user is authenticated, include their private folders
    if (req.user) {
      query = {
        $or: [
          { isPublic: true },
          { user: req.user._id }
        ]
      };
    } else {
      query = { isPublic: true };
    }

    // Add search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      });
    }

    const folders = await Folder.find(query)
      .populate('user', 'username')
      .populate('decks', 'name description type isPublic')
      .sort({ createdAt: -1 });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch folders', error: error.message });
  }
};

// @desc    Get folder by ID
// @route   GET /api/folders/:id
// @access  Public
export const getFolderById = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id)
      .populate('user', 'username')
      .populate('decks', 'name description type isPublic user');

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if user can access this folder
    if (!folder.isPublic && (!req.user || folder.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'Access denied to this private folder' });
    }

    res.json(folder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch folder', error: error.message });
  }
};

// @desc    Update folder
// @route   PUT /api/folders/:id
// @access  Private
export const updateFolder = async (req, res) => {
  const { name, description, isPublic } = req.body;
  
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if user owns this folder
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only update your own folders' });
    }

    // Check if new name conflicts with existing folder (if name is being changed)
    if (name && name !== folder.name) {
      const nameExists = await Folder.findOne({ 
        name, 
        user: req.user._id,
        _id: { $ne: req.params.id }
      });
      if (nameExists) {
        return res.status(400).json({ message: 'You already have a folder with this name' });
      }
    }

    // Update fields
    folder.name = name || folder.name;
    folder.description = description !== undefined ? description : folder.description;
    folder.isPublic = isPublic !== undefined ? isPublic : folder.isPublic;

    const updatedFolder = await folder.save();
    const populatedFolder = await Folder.findById(updatedFolder._id)
      .populate('user', 'username')
      .populate('decks', 'name description type isPublic');

    res.json(populatedFolder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not update folder', error: error.message });
  }
};

// @desc    Delete folder
// @route   DELETE /api/folders/:id
// @access  Private
export const deleteFolder = async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if user owns this folder
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own folders' });
    }

    await Folder.deleteOne({ _id: req.params.id });
    res.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not delete folder', error: error.message });
  }
};

// @desc    Add deck to folder
// @route   POST /api/folders/:id/decks
// @access  Private
export const addDeckToFolder = async (req, res) => {
  const { deckId } = req.body;
  
  if (!deckId) {
    return res.status(400).json({ message: 'Deck ID is required' });
  }

  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if user owns this folder
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only modify your own folders' });
    }

    // Check if deck exists and user has access to it
    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    // Check if user can access this deck (public deck or owns it)
    if (!deck.isPublic && deck.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only add decks you own or public decks' });
    }

    // Check if deck is already in folder
    if (folder.decks.includes(deckId)) {
      return res.status(400).json({ message: 'Deck is already in this folder' });
    }

    folder.decks.push(deckId);
    await folder.save();

    const populatedFolder = await Folder.findById(folder._id)
      .populate('user', 'username')
      .populate('decks', 'name description type isPublic');

    res.json(populatedFolder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not add deck to folder', error: error.message });
  }
};

// @desc    Remove deck from folder
// @route   DELETE /api/folders/:id/decks/:deckId
// @access  Private
export const removeDeckFromFolder = async (req, res) => {
  const { deckId } = req.params;
  
  try {
    const folder = await Folder.findById(req.params.id);
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    // Check if user owns this folder
    if (folder.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only modify your own folders' });
    }

    // Check if deck is in folder
    if (!folder.decks.includes(deckId)) {
      return res.status(400).json({ message: 'Deck is not in this folder' });
    }

    folder.decks = folder.decks.filter(id => id.toString() !== deckId);
    await folder.save();

    const populatedFolder = await Folder.findById(folder._id)
      .populate('user', 'username')
      .populate('decks', 'name description type isPublic');

    res.json(populatedFolder);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not remove deck from folder', error: error.message });
  }
};

// @desc    Get folders containing a specific deck
// @route   GET /api/folders/deck/:deckId
// @access  Private (only for deck access)
export const getFoldersContainingDeck = async (req, res) => {
  const { deckId } = req.params;
  
  try {
    // Check if deck exists
    const deck = await Deck.findById(deckId);
    if (!deck) {
      return res.status(404).json({ message: 'Deck not found' });
    }

    let query = { decks: deckId };
    
    // If user is authenticated, include their private folders + public folders
    if (req.user) {
      query = {
        decks: deckId,
        $or: [
          { isPublic: true },
          { user: req.user._id }
        ]
      };
    } else {
      query = { 
        decks: deckId,
        isPublic: true 
      };
    }

    const folders = await Folder.find(query)
      .populate('user', 'username')
      .sort({ createdAt: -1 });

    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: 'Server Error: Could not fetch folders for deck', error: error.message });
  }
};




