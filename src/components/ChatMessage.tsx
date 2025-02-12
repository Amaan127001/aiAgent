import React from 'react';
import { Bot } from 'lucide-react';
import { Message } from '../types';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const renderContent = (text: string) => {
    // Split text into mathematical expressions and regular text
    const mathRegex = /(\${1,2}[^$]+\${1,2})/g;
    const parts = text.split(mathRegex);

    return parts.map((part, i) => {
      if (part.match(/^\$\$.+\$\$$/)) {
        return <BlockMath key={i} math={part.replace(/^\$|\$$/g, '')} />;
      }
      if (part.match(/^\$.+\$$/)) {
        return <InlineMath key={i} math={part.replace(/^\$|\$$/g, '')} />;
      }
      
      // Format numbered steps and bold text
      const formattedText = part.split('\n').map((line, j) => {
        if (line.match(/^\d+\.\s+\*\*.+\*\*/)) {
          return (
            <div key={j} className="ml-4 my-2">
              <li className="text-[#b5179e] font-semibold">
                {line.replace(/\*\*/g, '')}
              </li>
            </div>
          );
        }
        if (line.match(/\*\*.+\*\*/)) {
          return (
            <strong key={j} className="text-[#4cc9f0]">
              {line.replace(/\*\*/g, '')}
            </strong>
          );
        }
        return <span key={j}>{line}</span>;
      });

      return <div key={i} className="space-y-2">{formattedText}</div>;
    });
  };

  const formatResponse = (text: string) => {
    const thinkMatch = text.match(/<think>([\s\S]*?)<\/think>/);
    const thinking = thinkMatch?.[1]?.trim() || '';
    const response = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();

    return (
      <div className="space-y-4">
        {thinking && (
          <div className="bg-[#0d1117]/60 p-3 rounded-lg border border-[#4cc9f0]/30">
            <div className="text-[#4cc9f0] text-sm font-mono italic">
              {thinking.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        )}

        <div className="text-white space-y-4">
          {response.split('\n\n').map((section, i) => (
            <div key={i} className="space-y-3">
              {section.split('\n').map((line, j) => {
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={j} className="text-lg font-semibold text-[#b5179e] mb-2">
                      {line.replace('### ', '')}
                    </h3>
                  );
                }
                return (
                  <div key={j} className="text-base leading-relaxed">
                    {renderContent(line)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`flex gap-2 sm:gap-3 max-w-3xl ${
        message.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
      }`}
    >
      {message.sender === 'bot' && (
        <Bot className="w-6 h-6 sm:w-8 sm-h-8 text-[#4cc9f0] flex-shrink-0" />
      )}
      <div
        className={`p-3 sm:p-4 rounded-lg shadow-lg backdrop-blur-sm ${
          message.sender === 'user'
            ? 'bg-gradient-to-r from-[#1c2333]/80 to-[#1a1b26]/80 border border-[#4cc9f0]'
            : 'bg-gradient-to-r from-[#0d1117]/80 to-[#1c2333]/80 border border-[#b5179e]'
        }`}
      >
        {message.sender === 'bot' ? (
          formatResponse(message.text)
        ) : (
          <p className="text-sm sm:text-base text-white">{message.text}</p>
        )}
        <span className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default ChatMessage;