import mongoose from 'mongoose';
import Flashcard from '../../models/Flashcard.js';
import { buildSemanticArtifacts } from '../../services/embeddingService.js';
import { hybridSearch } from '../../services/retrievalService.js';

// Deterministic hash embeddings so the vector ranking is stable and offline.
describe('retrievalService.hybridSearch — deck-scoped candidate pool', () => {
    let originalProvider;
    const userId = new mongoose.Types.ObjectId();
    const deckId = new mongoose.Types.ObjectId();
    const otherDeckId = new mongoose.Types.ObjectId();

    beforeAll(() => {
        originalProvider = process.env.EMBEDDING_PROVIDER;
        process.env.EMBEDDING_PROVIDER = 'hash';
    });
    afterAll(() => {
        if (originalProvider === undefined) delete process.env.EMBEDDING_PROVIDER;
        else process.env.EMBEDDING_PROVIDER = originalProvider;
    });

    const seedCard = async ({ question, explanation, code = '', decks = [deckId] }) => {
        const _id = new mongoose.Types.ObjectId();
        const artifacts = await buildSemanticArtifacts(
            { question, explanation, problemStatement: '', code, tags: [] },
            { cardId: _id, allowFallback: true },
        );
        return Flashcard.create({
            _id,
            question,
            explanation,
            code,
            type: 'DSA',
            user: userId,
            isPublic: true,
            decks,
            cardEmbedding: artifacts.cardEmbedding,
            semanticChunks: artifacts.semanticChunks,
            embeddingMeta: artifacts.embeddingMeta,
            embeddingVersion: artifacts.embeddingVersion,
        });
    };

    it('surfaces a keyword-only match the vector pre-filter would cut', async () => {
        // Deck far larger than fetchK for deck chat (topK 3 * oversample 4 = 12).
        for (let i = 0; i < 40; i += 1) {
            await seedCard({
                question: `Filler ${i}: comparison sorts`,
                explanation: `Notes ${i} on partitioning, pivots and merge steps.`,
            });
        }
        const needle = await seedCard({
            question: 'Obscure aside',
            explanation: 'The phrase zorblax quantal fissure appears verbatim only on this card.',
        });

        const results = await hybridSearch({
            userId,
            deckId,
            query: 'zorblax quantal fissure',
            mode: 'hybrid',
            topK: 3,
        });

        expect(results.map((r) => String(r._id))).toContain(String(needle._id));
    });

    it("matches a keyword that appears only in a card's code", async () => {
        for (let i = 0; i < 15; i += 1) {
            await seedCard({ question: `noise ${i}`, explanation: `noise body ${i}` });
        }
        const codeCard = await seedCard({
            question: 'Small helper',
            explanation: 'a sampling utility',
            code: 'def reservoir_sample(stream):\n    return chosen',
        });

        const results = await hybridSearch({
            userId,
            deckId,
            query: 'reservoir_sample',
            mode: 'hybrid',
            topK: 3,
        });

        expect(results.map((r) => String(r._id))).toContain(String(codeCard._id));
    });

    it('never returns cards outside the scoped deck', async () => {
        await seedCard({ question: 'In-deck card', explanation: 'ordinary content about graphs' });
        const foreign = await seedCard({
            question: 'Foreign card',
            explanation: 'this one contains the wibblefish keyword',
            decks: [otherDeckId],
        });

        const results = await hybridSearch({
            userId,
            deckId,
            query: 'wibblefish',
            mode: 'hybrid',
            topK: 5,
        });

        expect(results.map((r) => String(r._id))).not.toContain(String(foreign._id));
    });
});
