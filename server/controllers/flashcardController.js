// server/controllers/flashcardController.js
import Flashcard from '../models/Flashcard.js';
import { buildCacheKey, getCache, setCache, bumpCacheVersion } from '../services/cache.js';
import logger from '../utils/logger.js';
import { buildSemanticArtifacts } from '../services/embeddingService.js';

// @desc    Get flashcards with pagination and filtering
// @route   GET /api/flashcards
// @query   page (default: 1), limit (default: 20), type, deck, tags, search, sort (newest/oldest)
// @access  Public (but shows more if authenticated)
const getFlashcards = async (req, res) => {
    try {
        const cacheKey = await buildCacheKey('flashcards', req);
        const cached = await getCache(cacheKey);
        if (cached) {
            return res.status(200).json(cached);
        }

        const { 
            page = 1, 
            limit = 20, 
            type, 
            deck, 
            tags, 
            search,
            sort = 'newest',
            paginate = 'true', // Allow disabling pagination for backward compatibility
            contentMode,
        } = req.query;

        // Build base query for visibility
        let baseQuery = { isPublic: true };
        if (req.user) {
            baseQuery = {
                $or: [
                    { isPublic: true },
                    { user: req.user._id }
                ]
            };
        }

        // Build filter query
        const filterQuery = { ...baseQuery };

        // Type filter (specific type wins; else optional GRE vs standard hub split)
        if (type && type !== 'All') {
            filterQuery.type = type;
        } else if (contentMode === 'gre') {
            filterQuery.type = { $in: ['GRE-Word', 'GRE-MCQ'] };
        } else if (contentMode === 'standard') {
            filterQuery.type = { $nin: ['GRE-Word', 'GRE-MCQ'] };
        }

        // Deck filter
        if (deck && deck !== 'All') {
            filterQuery.decks = deck;
        }

        // Tags filter (match all provided tags)
        if (tags) {
            const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
            if (tagsArray.length > 0 && tagsArray[0] !== '') {
                filterQuery.tags = { $all: tagsArray };
            }
        }

        // Search filter (search in question, explanation, problemStatement)
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filterQuery.$and = filterQuery.$and || [];
            filterQuery.$and.push({
                $or: [
                    { question: searchRegex },
                    { explanation: searchRegex },
                    { problemStatement: searchRegex }
                ]
            });
        }

        // Determine sort order
        const sortOrder = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };

        // If pagination is disabled, return all results (backward compatibility)
        if (paginate === 'false') {
            const flashcards = await Flashcard.find(filterQuery)
                .populate('decks', 'name _id')
                .populate('user', 'username')
                .sort(sortOrder)
                .lean();
            
            await setCache(cacheKey, flashcards, 300);
            return res.status(200).json(flashcards);
        }

        // Calculate pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Execute query with pagination
        const [flashcards, totalCount] = await Promise.all([
            Flashcard.find(filterQuery)
                .populate('decks', 'name _id')
                .populate('user', 'username')
                .sort(sortOrder)
                .skip(skip)
                .limit(limitNum)
                .lean(),
            Flashcard.countDocuments(filterQuery),
        ]);

        // Get unique tags from all matching flashcards (for filter options)
        const allTags = await Flashcard.distinct('tags', baseQuery);

        const responsePayload = {
            flashcards,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalItems: totalCount,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < Math.ceil(totalCount / limitNum),
                hasPrevPage: pageNum > 1
            },
            filters: {
                availableTags: allTags.sort()
            }
        };

        await setCache(cacheKey, responsePayload, 300);
        res.status(200).json(responsePayload);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch flashcards', error: error.message });
    }
};

// @desc    Create a flashcard
// @route   POST /api/flashcards
// @access  Private
const createFlashcard = async (req, res) => {
    const {
        question, hint, explanation, problemStatement, code, link, type, tags, decks, isPublic,
        metadata, language, isGenerated, originParentId, generationMetadata,
    } = req.body;

    if (!question || !explanation || !type) {
        return res.status(400).json({ message: 'Question, Explanation, and Type are required' });
    }

    try {
        const semanticArtifacts = buildSemanticArtifacts({
            question,
            explanation,
            problemStatement,
            code,
            tags: tags || [],
        });

        const newFlashcard = new Flashcard({
            question,
            hint,
            explanation,
            problemStatement,
            code,
            link,
            type,
            tags: tags || [],
            decks: decks || [],
            metadata: metadata || {},
            isGenerated: Boolean(isGenerated),
            originParentId: originParentId || null,
            generationMetadata: generationMetadata || {},
            embeddingVersion: semanticArtifacts.embeddingVersion,
            cardEmbedding: semanticArtifacts.cardEmbedding,
            semanticChunks: semanticArtifacts.semanticChunks,
            topicNodes: semanticArtifacts.topics.map((topicNode) => ({
                ...topicNode,
                edgeType: 'related_to',
            })),
            user: req.user._id,
            isPublic: isPublic !== undefined ? isPublic : true,
            language: language || 'python',
        });

        const savedFlashcard = await newFlashcard.save();
        await bumpCacheVersion('flashcards');
        const populatedFlashcard = await Flashcard.findById(savedFlashcard._id)
            .populate('decks', 'name _id')
            .populate('user', 'username');
        logger.info('Flashcard created', {
            userId: req.user._id?.toString(),
            flashcardId: savedFlashcard._id?.toString(),
            cardType: savedFlashcard.type,
        });
        res.status(201).json(populatedFlashcard);
    } catch (error) {
        logger.error('createFlashcard failed', { message: error.message, stack: error.stack });
        res.status(500).json({ message: 'Server Error: Could not create flashcard', error: error.message });
    }
};

// @desc    Update a flashcard
// @route   PUT /api/flashcards/:id
// @access  Private (owner only)
const updateFlashcard = async (req, res) => {
    const {
        question, hint, explanation, problemStatement, code, link, type, tags, decks, isPublic,
        metadata, language, isGenerated, originParentId, generationMetadata,
    } = req.body;

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
        flashcard.problemStatement = problemStatement !== undefined ? problemStatement : flashcard.problemStatement;
        flashcard.code = code !== undefined ? code : flashcard.code;
        flashcard.link = link !== undefined ? link : flashcard.link;
        flashcard.type = type !== undefined ? type : flashcard.type;
        flashcard.tags = tags !== undefined ? tags : flashcard.tags;
        flashcard.decks = decks !== undefined ? decks : flashcard.decks;
        flashcard.metadata = metadata !== undefined ? metadata : flashcard.metadata;
        flashcard.isPublic = isPublic !== undefined ? isPublic : flashcard.isPublic;
        flashcard.language = language !== undefined ? language : flashcard.language;
        flashcard.isGenerated = isGenerated !== undefined ? Boolean(isGenerated) : flashcard.isGenerated;
        flashcard.originParentId = originParentId !== undefined ? originParentId : flashcard.originParentId;
        flashcard.generationMetadata = generationMetadata !== undefined ? generationMetadata : flashcard.generationMetadata;

        const semanticArtifacts = buildSemanticArtifacts({
            question: flashcard.question,
            explanation: flashcard.explanation,
            problemStatement: flashcard.problemStatement,
            code: flashcard.code,
            tags: flashcard.tags,
        });
        flashcard.embeddingVersion = semanticArtifacts.embeddingVersion;
        flashcard.cardEmbedding = semanticArtifacts.cardEmbedding;
        flashcard.semanticChunks = semanticArtifacts.semanticChunks;
        flashcard.topicNodes = semanticArtifacts.topics.map((topicNode) => ({
            ...topicNode,
            edgeType: 'related_to',
        }));

        const savedFlashcard = await flashcard.save();
        await bumpCacheVersion('flashcards');
        const populatedFlashcard = await Flashcard.findById(savedFlashcard._id)
            .populate('decks', 'name _id')
            .populate('user', 'username');
        logger.info('Flashcard updated', {
            userId: req.user._id?.toString(),
            flashcardId: savedFlashcard._id?.toString(),
        });
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
        await bumpCacheVersion('flashcards');
        logger.info('Flashcard deleted', { userId: req.user._id?.toString(), flashcardId: req.params.id });
        res.status(200).json({ message: 'Flashcard removed', id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not delete flashcard', error: error.message });
    }
};

// @desc    Get flashcards created on a specific date (for EOD revision)
// @route   GET /api/flashcards/created-on-date?date=YYYY-MM-DD
// @access  Private
const getFlashcardsCreatedOnDate = async (req, res) => {
    try {
        const { date } = req.query;
        
        if (!date) {
            return res.status(400).json({ message: 'Date parameter is required (format: YYYY-MM-DD)' });
        }

        // Parse the date and create start/end of day
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

        // Find flashcards created by the user on the specified date
        const flashcards = await Flashcard.find({
            user: req.user._id,
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        })
            .populate('decks', 'name _id')
            .populate('user', 'username')
            .sort({ createdAt: 1 })
            .lean();
        
        res.status(200).json(flashcards);
    } catch (error) {
        res.status(500).json({ message: 'Server Error: Could not fetch flashcards', error: error.message });
    }
};

export { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard, getFlashcardsCreatedOnDate };