import React, { useState, useEffect } from 'react';
import { Bot, Paperclip, ArrowUp } from 'lucide-react';
import Sidebar from './Sidebar';
import NewChatButton from './NewChatButton';
import ChatMessage from './ChatMessage';
import { Message, ChatSession } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SplashCursor } from './ui/splash-cursor';
import {
  createNewChat,
  saveMessage,
  loadChatMessages,
  convertToChatSession,
  loadChatHistory,
} from '../utils/chat';

const NEW_CHAT_KEY = 'neuroforge_new_chat_started';

const ChatWindow = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [pendingChatId, setPendingChatId] = useState<string | null>(null);

  useEffect(() => {
    const initializeChat = async () => {
      if (!user) return;
      try {
        const chats = await loadChatHistory(user.id);
        const isNewChat = sessionStorage.getItem(NEW_CHAT_KEY) === 'true';

        if (chats.length > 0 && !isNewChat) {
          const messages = await loadChatMessages(chats[0].id);
          const session = convertToChatSession(chats[0], messages);
          setCurrentSession(session);
          setShowWelcome(false);
        } else {
          setCurrentSession(null);
          setShowWelcome(true);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };
    initializeChat();
  }, [user]);

  const handleNewChat = () => {
    sessionStorage.setItem(NEW_CHAT_KEY, 'true');
    setCurrentSession(null);
    setPendingChatId(null);
    setShowWelcome(true);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !user) return;

    try {
      setShowWelcome(false);
      setIsLoading(true);
      sessionStorage.removeItem(NEW_CHAT_KEY);

      let chatId = currentSession?.id || pendingChatId;
      if (!chatId) {
        chatId = await createNewChat(user.id, message);
        setPendingChatId(chatId);
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date(),
      };

      const newSession = currentSession || { id: chatId, messages: [], createdAt: new Date() };
      const updatedSession = { ...newSession, messages: [...newSession.messages, userMessage] };

      setCurrentSession(updatedSession);
      setMessage('');
      await saveMessage(chatId, userMessage.text, 'user');

      const response = await fetch('https://4821-34-143-145-123.ngrok-free.app/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message }),
      });

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };

      await saveMessage(chatId, botResponse.text, 'bot');

      const finalSession = { ...updatedSession, messages: [...updatedSession.messages, botResponse] };
      setCurrentSession(finalSession);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-transparent text-white font-mono">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <SplashCursor />
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onNewChat={handleNewChat}
        currentChatId={currentSession?.id || null}
      />

      {/* Chat Window */}
      <div className="flex flex-col flex-1 w-full min-h-0 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d1117]/95 to-[#1a1b26]/95 backdrop-blur-md p-3 sm:p-4 flex items-center justify-between border-b border-[#4cc9f0]/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-[#4cc9f0]" />
            <div>
              <h1 className="text-lg sm:text-xl font-semibold text-[#4cc9f0]">NeuroForge</h1>
              <p className="text-xs sm:text-sm text-[#b5179e]">AI Assistant</p>
            </div>
          </div>
          <NewChatButton onClick={handleNewChat} />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-transparent custom-scrollbar pb-20 sm:pb-4">
          {showWelcome && (
            <div className="flex gap-2 sm:gap-3 max-w-3xl mx-auto bg-gradient-to-r from-[#0d1117]/80 to-[#1c2333]/80 border border-[#b5179e] p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-[#4cc9f0] flex-shrink-0" />
              <div>
                <p className="text-sm sm:text-base text-white">Hi, I'm NeuroForge. How can I help you today?</p>
              </div>
            </div>
          )}
          {currentSession?.messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 p-3 sm:p-4 bg-gradient-to-r from-[#0d1117]/95 to-[#1a1b26]/95 backdrop-blur-md border-t border-[#4cc9f0]/20"
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="flex gap-2 bg-[#1c2333]/80 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-[#4cc9f0]">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message NeuroForge..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 text-sm sm:text-base min-w-0"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading} className="p-1.5 sm:p-2 bg-[#4cc9f0] rounded-lg">
                <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;