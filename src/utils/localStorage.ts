import { ChatSession, Message } from '../types';

const STORAGE_KEY = 'neuroforge_chat_sessions';

export const saveChatSession = (session: ChatSession) => {
  const sessions = getChatSessions();
  const updatedSessions = [...sessions.filter(s => s.id !== session.id), session];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
};

export const getChatSessions = (): ChatSession[] => {
  const sessions = localStorage.getItem(STORAGE_KEY);
  return sessions ? JSON.parse(sessions) : [];
};

export const createNewSession = (): ChatSession => {
  return {
    id: Date.now().toString(),
    messages: [{
      id: '1',
      text: "Hi, I'm NeuroForge. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }],
    createdAt: new Date()
  };
};

export const clearAllSessions = () => {
  localStorage.removeItem(STORAGE_KEY);
};