import Conversation from '../models/Conversation.js';

export const listConversations = async (req, res) => {
  const conversations = await Conversation.find({
    user: req.user?._id,
  })
    .select('title updatedAt createdAt messages')
    .sort({ updatedAt: -1 });

  const result = conversations.map((c) => ({
    _id: c._id,
    title: c.title,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    messageCount: c.messages.length,
  }));

  res.json(result);
};

export const getConversation = async (req, res) => {
  const conversation = await Conversation.findOne({
    _id: req.params.id,
    user: req.user?._id,
  });

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  res.json(conversation);
};

export const createConversation = async (req, res) => {
  const conversation = await Conversation.create({
    user: req.user?._id,
    title: req.body.title || 'New conversation',
    messages: [],
  });

  res.status(201).json(conversation);
};

export const updateConversationMessages = async (req, res) => {
  const { messages, title } = req.body;

  const conversation = await Conversation.findOneAndUpdate(
    {
      _id: req.params.id,
      user: req.user?._id,
    },
    {
      ...(title ? { title } : {}),
      messages,
    },
    { new: true }
  );

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  res.json(conversation);
};

export const deleteConversation = async (req, res) => {
  const conversation = await Conversation.findOneAndDelete({
    _id: req.params.id,
    user: req.user?._id,
  });

  if (!conversation) {
    return res.status(404).json({ message: 'Conversation not found' });
  }

  res.json({ message: 'Conversation deleted', id: req.params.id });
};