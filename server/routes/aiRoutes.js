/**
 * AI Routes
 * 
 * Routes for AI-powered features:
 * - POST /api/ai/generate-test-cards - Generate test cards from study content
 * - POST /api/ai/save-test-cards - Save approved test cards to flashcard
 * - POST /api/ai/generate-outline - Generate outline from transcript
 * - POST /api/ai/analyze-code - Analyze code for complexity and improvements
 * - POST /api/ai/analyze-notes - Analyze notes and suggest improvements
 * - POST /api/ai/get-transcript - Get YouTube video transcript
 * - POST /api/ai/search-transcript - Search within video transcript
 * - GET /api/ai/status - Check AI service status
 */

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    generateTestCards,
    saveTestCards,
    generateOutline,
    analyzeCode,
    analyzeNotes,
    getTranscript,
    searchTranscript,
    checkStatus,
    semanticSearch,
    ragTutor,
    topicMine,
    reindexSemantic,
} from '../controllers/aiController.js';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// Test card generation
router.post('/generate-test-cards', generateTestCards);
router.post('/save-test-cards', saveTestCards);

// Outline/scaffold generation
router.post('/generate-outline', generateOutline);

// Code analysis
router.post('/analyze-code', analyzeCode);

// Notes analysis
router.post('/analyze-notes', analyzeNotes);

// Transcript operations
router.post('/get-transcript', getTranscript);
router.post('/search-transcript', searchTranscript);

// Status check (lighter auth requirement could be added if needed)
router.get('/status', checkStatus);
router.post('/semantic-search', semanticSearch);
router.post('/rag-tutor', ragTutor);
router.post('/topic-mine', topicMine);
router.post('/reindex-semantic', reindexSemantic);

export default router;




