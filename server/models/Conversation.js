import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: {
      type: Array,
      default: [],
    },
    confidence: String,
    insufficientEvidence: Boolean,
    retrieval: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);
const conversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      default: 'New conversation',
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    initialContext: {
      type: String,
      default: '',
    },
    initialCitations: {
      type: Array,
      default: [],
    },
    scopedDeckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      default: null,
    },
  },
  { timestamps: true }
);
export default mongoose.model('Conversation', conversationSchema);