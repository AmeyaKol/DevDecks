/**
 * AI Controller
 * 
 * Handles AI-powered features:
 * - Test card generation
 * - Outline/scaffold generation
 * - Code analysis
 * - Notes analysis
 * - Transcript extraction
 */

import geminiService from '../services/geminiService.js';
import transcriptService from '../services/transcriptService.js';
import Flashcard from '../models/Flashcard.js';

/**
 * Generate test cards from study content
 * POST /api/ai/generate-test-cards
 */
export const generateTestCards = async (req, res) => {
    try {
        const { studyContent, cardType, maxCards = 5, flashcardId } = req.body;
        
        if (!studyContent) {
            return res.status(400).json({ 
                error: 'Study content is required',
                message: 'Please provide study content to generate test cards from.'
            });
        }
        
        const cards = await geminiService.generateTestCards(studyContent, cardType, maxCards);
        
        // If flashcardId is provided, optionally save the generated cards
        if (flashcardId) {
            const flashcard = await Flashcard.findById(flashcardId);
            if (flashcard && flashcard.user.toString() === req.user._id.toString()) {
                // Don't auto-save, just return for review
                // The frontend will call a separate endpoint to save approved cards
            }
        }
        
        res.json({
            success: true,
            cards,
            count: cards.length,
            message: `Generated ${cards.length} test cards. Review and edit before saving.`
        });
        
    } catch (error) {
        console.error('Error generating test cards:', error);
        
        if (error.message.includes('Rate limit')) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                message: error.message
            });
        }
        
        if (error.message.includes('GEMINI_API_KEY')) {
            return res.status(503).json({ 
                error: 'AI service not configured',
                message: 'The AI service is not configured. Please contact the administrator.'
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to generate test cards',
            message: error.message
        });
    }
};

/**
 * Save approved test cards to a flashcard
 * POST /api/ai/save-test-cards
 */
export const saveTestCards = async (req, res) => {
    try {
        const { flashcardId, testCards } = req.body;
        
        if (!flashcardId || !testCards || !Array.isArray(testCards)) {
            return res.status(400).json({ 
                error: 'Invalid request',
                message: 'Please provide flashcardId and an array of testCards.'
            });
        }
        
        const flashcard = await Flashcard.findById(flashcardId);
        
        if (!flashcard) {
            return res.status(404).json({ error: 'Flashcard not found' });
        }
        
        // Check ownership
        if (flashcard.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Not authorized to modify this flashcard' });
        }
        
        // Validate and format test cards
        const formattedCards = testCards.map(card => ({
            question: card.question?.trim() || '',
            answer: card.answer?.trim() || '',
            hint: card.hint?.trim() || '',
            difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
            aiGenerated: card.aiGenerated !== false,
            createdAt: new Date(),
        })).filter(card => card.question && card.answer);
        
        // Append to existing test cards
        flashcard.testCards = [...(flashcard.testCards || []), ...formattedCards];
        await flashcard.save();
        
        res.json({
            success: true,
            message: `Saved ${formattedCards.length} test cards`,
            totalTestCards: flashcard.testCards.length
        });
        
    } catch (error) {
        console.error('Error saving test cards:', error);
        res.status(500).json({ 
            error: 'Failed to save test cards',
            message: error.message
        });
    }
};

/**
 * Generate outline/scaffold from transcript or topic
 * POST /api/ai/generate-outline
 */
export const generateOutline = async (req, res) => {
    try {
        const { transcript, topic, videoUrl } = req.body;
        
        let content = transcript;
        
        // If videoUrl provided but no transcript, try to fetch it
        if (videoUrl && !transcript) {
            try {
                content = await transcriptService.getFormattedTranscript(videoUrl);
            } catch (transcriptError) {
                return res.status(400).json({
                    error: 'Could not fetch transcript',
                    message: transcriptError.message
                });
            }
        }
        
        if (!content) {
            return res.status(400).json({ 
                error: 'Content required',
                message: 'Please provide transcript content or a video URL with available transcript.'
            });
        }
        
        const outline = await geminiService.generateOutline(content, topic);
        
        res.json({
            success: true,
            outline,
            message: 'Outline generated successfully. Copy to your study notes and fill in the details.'
        });
        
    } catch (error) {
        console.error('Error generating outline:', error);
        
        if (error.message.includes('Rate limit')) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to generate outline',
            message: error.message
        });
    }
};

/**
 * Analyze code for complexity, naming, and improvements
 * POST /api/ai/analyze-code
 */
export const analyzeCode = async (req, res) => {
    try {
        const { code, language = 'python' } = req.body;
        
        if (!code) {
            return res.status(400).json({ 
                error: 'Code is required',
                message: 'Please provide code to analyze.'
            });
        }
        
        const analysis = await geminiService.analyzeCode(code, language);
        
        res.json({
            success: true,
            analysis,
            message: 'Code analysis complete.'
        });
        
    } catch (error) {
        console.error('Error analyzing code:', error);
        
        if (error.message.includes('Rate limit')) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to analyze code',
            message: error.message
        });
    }
};

/**
 * Analyze notes and suggest improvements
 * POST /api/ai/analyze-notes
 */
export const analyzeNotes = async (req, res) => {
    try {
        const { notes, transcript } = req.body;
        
        if (!notes) {
            return res.status(400).json({ 
                error: 'Notes are required',
                message: 'Please provide notes to analyze.'
            });
        }
        
        const analysis = await geminiService.analyzeNotes(notes, transcript);
        
        res.json({
            success: true,
            analysis,
            message: 'Notes analysis complete.'
        });
        
    } catch (error) {
        console.error('Error analyzing notes:', error);
        
        if (error.message.includes('Rate limit')) {
            return res.status(429).json({ 
                error: 'Rate limit exceeded',
                message: error.message
            });
        }
        
        res.status(500).json({ 
            error: 'Failed to analyze notes',
            message: error.message
        });
    }
};

/**
 * Get transcript for a YouTube video
 * POST /api/ai/get-transcript
 */
export const getTranscript = async (req, res) => {
    try {
        const { videoUrl, startTime, endTime, formatted = false } = req.body;
        
        if (!videoUrl) {
            return res.status(400).json({ 
                error: 'Video URL is required',
                message: 'Please provide a YouTube video URL.'
            });
        }
        
        let result;
        
        if (formatted) {
            result = {
                transcript: await transcriptService.getFormattedTranscript(videoUrl),
                formatted: true,
            };
        } else if (startTime !== undefined || endTime !== undefined) {
            result = await transcriptService.getTranscriptSegment(
                videoUrl, 
                startTime || 0, 
                endTime || Infinity
            );
        } else {
            const segments = await transcriptService.getFullTranscript(videoUrl);
            result = {
                segments,
                text: segments.map(s => s.text).join(' '),
            };
        }
        
        res.json({
            success: true,
            ...result,
            message: 'Transcript fetched successfully.'
        });
        
    } catch (error) {
        console.error('Error fetching transcript:', error);
        
        res.status(500).json({ 
            error: 'Failed to fetch transcript',
            message: error.message
        });
    }
};

/**
 * Search within a video's transcript
 * POST /api/ai/search-transcript
 */
export const searchTranscript = async (req, res) => {
    try {
        const { videoUrl, query } = req.body;
        
        if (!videoUrl || !query) {
            return res.status(400).json({ 
                error: 'Video URL and search query are required'
            });
        }
        
        const matches = await transcriptService.searchTranscript(videoUrl, query);
        
        res.json({
            success: true,
            matches,
            count: matches.length,
            message: `Found ${matches.length} matches for "${query}"`
        });
        
    } catch (error) {
        console.error('Error searching transcript:', error);
        
        res.status(500).json({ 
            error: 'Failed to search transcript',
            message: error.message
        });
    }
};

/**
 * Check AI service status
 * GET /api/ai/status
 */
export const checkStatus = async (req, res) => {
    try {
        const geminiStatus = await geminiService.checkApiStatus();
        
        res.json({
            success: true,
            services: {
                gemini: geminiStatus,
                transcript: { configured: true, working: true },
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to check status',
            message: error.message
        });
    }
};




