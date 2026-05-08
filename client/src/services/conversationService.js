
import api from './api';

export const fetchConversations = async () => {
  try {
    const response = await api.get('/conversations');
    return response.data;
  } catch (error) {
    console.error('Fetch conversations error:', error);
    throw error;
  }
};

export const fetchConversation = async (id) => {
  try {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch conversation error:', error);
    throw error;
  }
};

export const createConversation = async (title = 'New conversation', scopedDeckId = null) => {
  try {
    const response = await api.post('/conversations', { title, scopedDeckId });
    return response.data;
  } catch (error) {
    console.error('Create conversation error:', error);
    throw error;
  }
};

export const saveConversationMessages = async (id, messages, title) => {
  try {
    const response = await api.put(`/conversations/${id}/messages`, {
      messages,
      title,
    });

    return response.data;
  } catch (error) {
    console.error('Save conversation messages error:', error);
    throw error;
  }
};

export const deleteConversation = async (id) => {
  try {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  } catch (error) {
    console.error('Delete conversation error:', error);
    throw error;
  }
};