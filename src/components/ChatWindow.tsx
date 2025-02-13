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

// Session storage key for tracking new chat state
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

        // Check if we're in a new chat state
        const isNewChat = sessionStorage.getItem(NEW_CHAT_KEY) === 'true';

        if (chats.length > 0 && !isNewChat) {
          const messages = await loadChatMessages(chats[0].id);
          const session = convertToChatSession(chats[0], messages);
          setCurrentSession(session);
          setShowWelcome(false);
        } else {
          // Either no chats exist or we're in a new chat state
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
    // Set new chat state in session storage
    sessionStorage.setItem(NEW_CHAT_KEY, 'true');
    setCurrentSession(null);
    setPendingChatId(null);
    setShowWelcome(true);
    setIsOpen(false);
  };

  const handleChatSelect = async (chatId: string) => {
    if (!user) return;

    try {
      // Clear new chat state when selecting a specific chat
      sessionStorage.removeItem(NEW_CHAT_KEY);

      const chats = await loadChatHistory(user.id);
      const selectedChat = chats.find((chat) => chat.id === chatId);
      if (!selectedChat) return;

      const messages = await loadChatMessages(chatId);
      const session = convertToChatSession(selectedChat, messages);
      setCurrentSession(session);
      setShowWelcome(false);
      setPendingChatId(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !user) return;

    try {
      setShowWelcome(false);
      setIsLoading(true);

      // Clear new chat state when starting a new conversation
      sessionStorage.removeItem(NEW_CHAT_KEY);

      // Create new chat if needed
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

      const newSession = currentSession || {
        id: chatId,
        messages: [],
        createdAt: new Date(),
      };

      const updatedSession = {
        ...newSession,
        messages: [...newSession.messages, userMessage],
      };

      setCurrentSession(updatedSession);
      setMessage('');
      await saveMessage(chatId, userMessage.text, 'user');

      // Updated API endpoint to match your Hugging Face Spaces backend
      // const response = await fetch('https://mohdamaan-deepdistilled.hf.space/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message: message }),
      // });

      // const response = await fetch('http://192.168.29.56:5000/chat', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ message: message }),
      // });

      const response = await fetch('https://becc-34-90-46-245.ngrok-free.app/chat', {
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

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, botResponse],
      };

      setCurrentSession(finalSession);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: 'error-' + Date.now().toString(),
        text: "I'm having trouble responding. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };

      setCurrentSession((prev) =>
        prev
          ? {
              ...prev,
              messages: [...prev.messages, errorMessage],
            }
          : null
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Clear new chat state when component unmounts
  useEffect(() => {
    return () => {
      sessionStorage.removeItem(NEW_CHAT_KEY);
    };
  }, []);

  return (
    <div className="flex h-screen bg-transparent text-white font-mono relative overflow-hidden">
      {/* Fluid Background */}
      <div className="absolute inset-0 z-0">
        <SplashCursor />
      </div>

      {/* Sidebar */}
      <Sidebar
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        onNewChat={handleNewChat}
        currentChatId={currentSession?.id || null}
        onChatSelect={handleChatSelect}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col w-full relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0d1117]/95 to-[#1a1b26]/95 backdrop-blur-md p-3 sm:p-4 flex items-center justify-between border-b border-[#4cc9f0]/20 pl-14 sm:pl-16">
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-transparent custom-scrollbar">
          {showWelcome && (
            <div className="flex gap-2 sm:gap-3 max-w-3xl mx-auto bg-gradient-to-r from-[#0d1117]/80 to-[#1c2333]/80 border border-[#b5179e] p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm">
              <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-[#4cc9f0] flex-shrink-0" />
              <div>
                <p className="text-sm sm:text-base text-white">
                  Hi, I'm NeuroForge. How can I help you today?
                </p>
              </div>
            </div>
          )}
          {currentSession?.messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSubmit}
          className="p-3 sm:p-4 bg-gradient-to-r from-[#0d1117]/95 to-[#1a1b26]/95 backdrop-blur-md border-t border-[#4cc9f0]/20"
        >
          <div className="relative max-w-4xl mx-auto">
            <div className="flex gap-2 bg-[#1c2333]/80 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-[#4cc9f0] transition-all">
              <button
                type="button"
                className="p-1.5 sm:p-2 hover:bg-[#0d1117]/60 rounded-lg transition-colors"
              >
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-[#4cc9f0]" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message NeuroForge..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 text-sm sm:text-base min-w-0"
                disabled={isLoading}
              />
              <div className="flex gap-1 sm:gap-2">
                <button
                  type="button"
                  className="p-1.5 sm:p-2 hover:bg-[#0d1117]/60 rounded-lg transition-colors"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-[#b5179e]" />
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`bg-gradient-to-r from-[#4cc9f0] to-[#b5179e] p-1.5 sm:p-2 rounded-lg ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  } transition-opacity`}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
