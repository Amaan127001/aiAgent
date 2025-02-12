/*
  # Chat History System Schema

  1. New Tables
    - `chats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `title` (text) - First message of chat for display
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      
    - `messages`
      - `id` (uuid, primary key)
      - `chat_id` (uuid, references chats)
      - `content` (text)
      - `role` (text) - 'user' or 'bot'
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to access their own data
*/

-- Create chats table
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  title text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  role text CHECK (role IN ('user', 'bot')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chats
CREATE POLICY "Users can create their own chats"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
  ON chats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
  ON chats
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for messages
CREATE POLICY "Users can create messages in their chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view messages from their chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats
      WHERE chats.id = messages.chat_id
      AND chats.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats(user_id);
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS chats_created_at_idx ON chats(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);