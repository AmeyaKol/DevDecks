import { useEffect, useState } from "react";
import { askRagTutor } from "../services/api";
import {
  fetchConversations,
  fetchConversation,
  createConversation,
  saveConversationMessages,
  deleteConversation,
} from '../services/conversationService';


export function useChat({ deckId } = {}) {
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConversationList = async () => {
    const list = await fetchConversations();
    setConversations(list);
  };

  useEffect(() => {
    loadConversationList().catch(console.error);
  }, []);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setError(null);
  }, [deckId]);

    const startNewConversation = async () => {
    const conversation = await createConversation('New conversation', deckId);

    setConversationId(conversation._id);
    setMessages([]);
    setInput('');
    setError(null);

    await loadConversationList();
  };

  const loadConversation = async (id) => {
    const conversation = await fetchConversation(id);

    setConversationId(conversation._id);
    setMessages(conversation.messages || []);
    setInput('');
    setError(null);
  };
    const removeConversation = async (id) => {
      await deleteConversation(id);

      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        setInput('');
        setError(null);
      }

      await loadConversationList();
    };

  const resetCurrentConversation = () => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setError(null);
  };



  const sendMessage = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const userMessage = {
      role: "user",
      content: question,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);


    try {
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        const title = question.length > 40
            ? `${question.slice(0, 40)}...`
            : question;

        const conversation = await createConversation(title, deckId);
        activeConversationId = conversation._id;
        setConversationId(activeConversationId);
      }
      const result = await askRagTutor({
        question,
        messages,
        conversationId: activeConversationId,
        deckId,
      });

      const assistantMessage = {
        role: "assistant",
        content: result.answer,
        citations: result.citations,
        confidence: result.confidence,
        insufficientEvidence: result.insufficientEvidence,
        retrieval: result.retrieval,
      };

      const finalMessages = [...nextMessages, assistantMessage];

      setMessages(finalMessages);

      const title = finalMessages[0]?.content
        ? finalMessages[0].content.slice(0, 50)
        : 'New conversation';

      await saveConversationMessages(activeConversationId, finalMessages, title);
      await loadConversationList();
    } catch (err) {
      setError(err.message || 'error occurred while communicating with the tutor');
    } finally {
      setLoading(false);
    }
  };

  return {
    conversationId,
    conversations,
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    loadConversation,
    startNewConversation,
    resetCurrentConversation,
    removeConversation,
  };
}