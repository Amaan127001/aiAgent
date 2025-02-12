import React from 'react';
import { PlusCircle } from 'lucide-react';

interface NewChatButtonProps {
  onClick: () => void;
}

const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-[#1c2333]/80 backdrop-blur-sm rounded-lg hover:bg-[#1c2333] transition-colors text-[#4cc9f0] text-sm sm:text-base whitespace-nowrap group"
    >
      <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-[#b5179e] transition-colors" />
      <span className="group-hover:text-[#b5179e] transition-colors">New Chat</span>
    </button>
  );
};

export default NewChatButton;