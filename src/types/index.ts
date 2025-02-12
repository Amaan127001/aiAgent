export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
}

export interface DatabaseChat {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseMessage {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'bot';
  created_at: string;
}

export interface GroupedChats {
  [key: string]: DatabaseChat[];
}