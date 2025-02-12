import { supabase } from '../lib/supabase';
import { DatabaseChat, DatabaseMessage, Message, ChatSession } from '../types';

export async function createNewChat(userId: string, firstMessage: string): Promise<string> {
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .insert({
      user_id: userId,
      title: firstMessage || 'New Chat' // Temporary title that won't be saved to DB
    })
    .select()
    .single();

  if (chatError) throw chatError;
  return chat.id;
}

export async function saveMessage(chatId: string, content: string, role: 'user' | 'bot'): Promise<void> {
  const { error: messageError } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      content,
      role
    });

  if (messageError) throw messageError;

  // Update chat title with first user message if it exists
  if (role === 'user') {
    const { data: messages, error: countError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .eq('role', 'user');

    if (!countError && messages && messages.length === 1) {
      // This is the first user message, update the chat title
      const { error: updateError } = await supabase
        .from('chats')
        .update({ title: content.slice(0, 100) })
        .eq('id', chatId);

      if (updateError) throw updateError;
    }
  }
}

export async function loadChatHistory(userId: string): Promise<DatabaseChat[]> {
  const { data: chats, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Filter out chats with no messages
  const validChats = [];
  for (const chat of chats) {
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chat.id);
      
    if (!countError && count && count > 0) {
      validChats.push(chat);
    } else {
      // Clean up empty chat
      await supabase
        .from('chats')
        .delete()
        .eq('id', chat.id);
    }
  }
  
  return validChats;
}

export async function loadChatMessages(chatId: string): Promise<DatabaseMessage[]> {
  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return messages;
}

export function convertToMessage(dbMessage: DatabaseMessage): Message {
  return {
    id: dbMessage.id,
    text: dbMessage.content,
    sender: dbMessage.role === 'user' ? 'user' : 'bot',
    timestamp: new Date(dbMessage.created_at)
  };
}

export function convertToChatSession(chat: DatabaseChat, messages: DatabaseMessage[]): ChatSession {
  return {
    id: chat.id,
    messages: messages.map(convertToMessage),
    createdAt: new Date(chat.created_at)
  };
}

export function groupChatsByDate(chats: DatabaseChat[]): { [key: string]: DatabaseChat[] } {
  const grouped: { [key: string]: DatabaseChat[] } = {};
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  chats.forEach(chat => {
    const chatDate = new Date(chat.created_at).toDateString();
    let groupKey: string;

    if (chatDate === today) {
      groupKey = 'Today';
    } else if (chatDate === yesterday) {
      groupKey = 'Yesterday';
    } else {
      groupKey = new Date(chat.created_at).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric'
      });
    }

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(chat);
  });

  return grouped;
}