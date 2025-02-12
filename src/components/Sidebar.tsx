import React, { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, Settings, PlusCircle, Menu, X, Trash2, Mail, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { DatabaseChat, GroupedChats } from '../types';
import { loadChatHistory, groupChatsByDate } from '../utils/chat';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onToggle, 
  onNewChat, 
  currentChatId,
  onChatSelect 
}) => {
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [groupedChats, setGroupedChats] = useState<GroupedChats>({});
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const chats = await loadChatHistory(user.id);
        setGroupedChats(groupChatsByDate(chats));
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteAllChats = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setGroupedChats({});
      onNewChat();
    } catch (error) {
      console.error('Error deleting chats:', error);
    }
    
    setIsDropdownOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsDropdownOpen(false);
  };

  const getUserInitial = () => {
    if (!user?.email) return '?';
    return user.email[0].toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user?.email) return 'User';
    return user.email.split('@')[0];
  };

  const formatChatTitle = (title: string) => {
    return title.length > 30 ? title.substring(0, 27) + '...' : title;
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed top-4 left-4 z-50 p-2 text-[#4cc9f0] hover:text-[#b5179e] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full bg-[#0d1117]/95 backdrop-blur-lg transition-transform duration-300 ease-in-out border-r border-[#1c2333] z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:w-64 w-4/5`}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#1c2333]">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#4cc9f0]" />
            <h2 className="text-[#4cc9f0] font-semibold">Chat History</h2>
          </div>
          <button 
            onClick={onToggle}
            className="text-[#b5179e] hover:text-[#4cc9f0] transition-colors p-2"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 p-4 flex flex-col h-[calc(100%-4rem)]">
          {/* Chat History */}
          <div className="mb-4 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-20">
                <div className="w-6 h-6 border-2 border-[#4cc9f0] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : Object.entries(groupedChats).length > 0 ? (
              Object.entries(groupedChats).map(([date, chats]) => (
                <div key={date} className="mb-4">
                  <h3 className="text-[#b5179e] text-sm mb-2">{date}</h3>
                  <div className="space-y-2">
                    {chats.map((chat: DatabaseChat) => (
                      <button
                        key={chat.id}
                        onClick={() => onChatSelect(chat.id)}
                        className={`w-full text-left p-2 rounded-lg transition-colors text-white group
                          ${currentChatId === chat.id 
                            ? 'bg-[#1c2333] text-[#4cc9f0]' 
                            : 'hover:bg-[#1c2333]/60'}`}
                      >
                        <MessageSquare className={`w-4 h-4 inline-block mr-2 
                          ${currentChatId === chat.id
                            ? 'text-[#4cc9f0]'
                            : 'text-[#4cc9f0] group-hover:text-[#b5179e]'} 
                          transition-colors`}
                        />
                        {formatChatTitle(chat.title)}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center mt-4">
                No chat history
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={onNewChat}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1c2333]/60 transition-colors text-[#4cc9f0] hover:text-[#b5179e] group"
            >
              <PlusCircle className="w-5 h-5 group-hover:text-[#b5179e] transition-colors" />
              New Chat
            </button>

            {/* User Profile Section */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#1c2333]/60 transition-colors text-white group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#4cc9f0] to-[#b5179e] flex items-center justify-center text-white font-semibold">
                  {getUserInitial()}
                </div>
                <span className="flex-1 text-left truncate">{getUserDisplayName()}</span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-[#1c2333]/95 backdrop-blur-sm rounded-lg border border-[#4cc9f0]/20 shadow-lg overflow-hidden">
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#0d1117]/60 transition-colors text-white"
                  >
                    <Settings className="w-5 h-5 text-[#4cc9f0]" />
                    Settings
                  </button>
                  <button
                    onClick={handleDeleteAllChats}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#0d1117]/60 transition-colors text-white"
                  >
                    <Trash2 className="w-5 h-5 text-[#4cc9f0]" />
                    Delete all chats
                  </button>
                  <button
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#0d1117]/60 transition-colors text-white"
                  >
                    <Mail className="w-5 h-5 text-[#4cc9f0]" />
                    Contact us
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#0d1117]/60 transition-colors text-white"
                  >
                    <LogOut className="w-5 h-5 text-[#4cc9f0]" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;