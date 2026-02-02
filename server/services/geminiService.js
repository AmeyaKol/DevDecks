/**
 * Gemini AI Service
 * 
 * Provides AI-powered features using Google's Gemini API:
 * - Generate test cards from study content
 * - Create outlines/scaffolds from transcripts
 * - Analyze code (complexity, comments, naming)
 * - Analyze and improve notes
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiting configuration
const RATE_LIMIT = {
    maxRequestsPerMinute: 15,
    requestTimes: [],
};

// Check rate limit before making a request
function checkRateLimit() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Remove requests older than 1 minute
    RATE_LIMIT.requestTimes = RATE_LIMIT.requestTimes.filter(time => time > oneMinuteAgo);
    
    if (RATE_LIMIT.requestTimes.length >= RATE_LIMIT.maxRequestsPerMinute) {
        const oldestRequest = RATE_LIMIT.requestTimes[0];
        const waitTime = Math.ceil((oldestRequest + 60000 - now) / 1000);
        throw new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
    }
    
    RATE_LIMIT.requestTimes.push(now);
}

// Initialize Gemini client
function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env file.');
    }
    
    return new GoogleGenerativeAI(apiKey);
}

// Get the generative model
function getModel(modelName = 'gemini-1.5-flash') {
    const genAI = getGeminiClient();
    return genAI.getGenerativeModel({ model: modelName });
}

/**
 * Generate test cards from study content
 * @param {string} studyContent - The detailed study notes/content
 * @param {string} cardType - The type of flashcard (DSA, System Design, etc.)
 * @param {number} maxCards - Maximum number of test cards to generate
 * @returns {Promise<Array>} Array of generated test cards
 */
export async function generateTestCards(studyContent, cardType = 'Technical Knowledge', maxCards = 5) {
    checkRateLimit();
    
    if (!studyContent || studyContent.trim().length < 50) {
        throw new Error('Study content is too short. Please provide more detailed content.');
    }

    const model = getModel();
    
    const prompt = `You are an expert educator creating flashcards for technical interview preparation.

Analyze the following study content and create ${maxCards} concise test flashcards.

Content Type: ${cardType}

Study Content:
${studyContent}

Requirements:
1. Each card should test ONE specific concept
2. Questions should be clear and unambiguous
3. Answers should be concise but complete (1-3 sentences)
4. Vary difficulty levels (easy, medium, hard)
5. For DSA: Focus on time/space complexity, edge cases, and approach
6. For System Design: Focus on trade-offs, scalability, and design decisions
7. For Technical Knowledge: Focus on definitions, comparisons, and best practices

Return your response as a valid JSON array with this exact structure:
[
  {
    "question": "Clear, specific question",
    "answer": "Concise, accurate answer",
    "hint": "Optional hint to help recall",
    "difficulty": "easy|medium|hard"
  }
]

Only return the JSON array, no additional text or markdown formatting.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the JSON response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response as JSON');
        }
        
        const cards = JSON.parse(jsonMatch[0]);
        
        // Validate and sanitize cards
        return cards.map(card => ({
            question: card.question?.trim() || 'Question not generated',
            answer: card.answer?.trim() || 'Answer not generated',
            hint: card.hint?.trim() || '',
            difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) ? card.difficulty : 'medium',
            aiGenerated: true,
            createdAt: new Date(),
        })).slice(0, maxCards);
        
    } catch (error) {
        if (error.message.includes('Rate limit')) {
            throw error;
        }
        console.error('Error generating test cards:', error);
        throw new Error(`Failed to generate test cards: ${error.message}`);
    }
}

/**
 * Generate an outline/scaffold from transcript or topic
 * @param {string} transcript - The video transcript or topic description
 * @param {string} topic - The main topic/title
 * @returns {Promise<string>} Markdown-formatted outline
 */
export async function generateOutline(transcript, topic = 'Study Notes') {
    checkRateLimit();
    
    if (!transcript || transcript.trim().length < 100) {
        throw new Error('Transcript is too short. Please provide more content.');
    }

    const model = getModel();
    
    const prompt = `You are an expert at creating structured study notes from video transcripts.

Topic: ${topic}

Transcript/Content:
${transcript.substring(0, 8000)} ${transcript.length > 8000 ? '...(truncated)' : ''}

Create a well-organized outline for taking notes on this content. Include:
1. Main headers (## for H2) for major topics
2. Subheaders (### for H3) for subtopics
3. Key questions to answer under each section (as bullet points)
4. Space for notes (use [Your notes here] as placeholder)

Format as clean Markdown that can be used directly in a note-taking editor.

Requirements:
- Use proper Markdown heading hierarchy
- Include 3-7 main sections depending on content length
- Add relevant questions that a learner should be able to answer
- Keep structure clean and scannable`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
        
    } catch (error) {
        if (error.message.includes('Rate limit')) {
            throw error;
        }
        console.error('Error generating outline:', error);
        throw new Error(`Failed to generate outline: ${error.message}`);
    }
}

/**
 * Analyze code for complexity, naming, and improvements
 * @param {string} code - The code to analyze
 * @param {string} language - Programming language
 * @returns {Promise<Object>} Analysis results
 */
export async function analyzeCode(code, language = 'python') {
    checkRateLimit();
    
    if (!code || code.trim().length < 10) {
        throw new Error('Code is too short to analyze.');
    }

    const model = getModel();
    
    const prompt = `You are an expert code reviewer and algorithm analyst.

Analyze this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Provide a comprehensive analysis in the following JSON format:
{
  "timeComplexity": "O(...) - brief explanation",
  "spaceComplexity": "O(...) - brief explanation",
  "explanation": "Clear explanation of what the code does and how it works (2-4 sentences)",
  "improvements": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2"
  ],
  "commentedCode": "The same code with helpful inline comments added",
  "potentialIssues": [
    "Any bugs, edge cases, or potential issues"
  ],
  "namingSuggestions": {
    "oldName": "suggestedBetterName"
  }
}

Only return valid JSON, no additional text or markdown.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response as JSON');
        }
        
        return JSON.parse(jsonMatch[0]);
        
    } catch (error) {
        if (error.message.includes('Rate limit')) {
            throw error;
        }
        console.error('Error analyzing code:', error);
        throw new Error(`Failed to analyze code: ${error.message}`);
    }
}

/**
 * Analyze notes and suggest improvements
 * @param {string} notes - Current notes
 * @param {string} transcript - Optional transcript for context
 * @returns {Promise<Object>} Analysis and suggestions
 */
export async function analyzeNotes(notes, transcript = '') {
    checkRateLimit();
    
    if (!notes || notes.trim().length < 50) {
        throw new Error('Notes are too short to analyze.');
    }

    const model = getModel();
    
    const contextSection = transcript 
        ? `\nOriginal Transcript/Source (for reference):\n${transcript.substring(0, 4000)}\n`
        : '';
    
    const prompt = `You are an expert study coach helping students improve their notes.

Current Notes:
${notes}
${contextSection}

Analyze these notes and provide feedback in the following JSON format:
{
  "overallScore": 1-10,
  "strengths": [
    "What the notes do well"
  ],
  "gaps": [
    "Important topics or details that might be missing"
  ],
  "suggestions": [
    "Specific suggestions for improvement"
  ],
  "questionsToConsider": [
    "Questions the student should be able to answer based on this topic"
  ],
  "improvedStructure": "Optional: A suggested reorganization of the notes (if needed)"
}

Only return valid JSON, no additional text or markdown.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Parse the JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response as JSON');
        }
        
        return JSON.parse(jsonMatch[0]);
        
    } catch (error) {
        if (error.message.includes('Rate limit')) {
            throw error;
        }
        console.error('Error analyzing notes:', error);
        throw new Error(`Failed to analyze notes: ${error.message}`);
    }
}

/**
 * Check if Gemini API is configured and working
 * @returns {Promise<Object>} Status object
 */
export async function checkApiStatus() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return {
            configured: false,
            working: false,
            message: 'GEMINI_API_KEY is not configured',
        };
    }
    
    try {
        const model = getModel();
        const result = await model.generateContent('Say "API working" and nothing else.');
        const response = await result.response;
        const text = response.text();
        
        return {
            configured: true,
            working: text.toLowerCase().includes('working'),
            message: 'Gemini API is configured and working',
        };
    } catch (error) {
        return {
            configured: true,
            working: false,
            message: `API configured but error occurred: ${error.message}`,
        };
    }
}

export default {
    generateTestCards,
    generateOutline,
    analyzeCode,
    analyzeNotes,
    checkApiStatus,
};




