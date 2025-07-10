/*
  # Create WhatsApp messages table

  1. New Tables
    - `whatsapp_messages`
      - `id` (uuid, primary key)
      - `message_id` (text, unique) - WhatsApp message ID
      - `from_number` (text) - Sender's phone number
      - `message_text` (text) - Message content
      - `timestamp` (text) - WhatsApp timestamp
      - `received_at` (timestamptz) - When webhook received it
      - `created_at` (timestamptz) - Database record creation time

  2. Security
    - Enable RLS on `whatsapp_messages` table
    - Add policy for public access (webhook needs to work without auth)

  3. Indexes
    - Index on message_id for fast duplicate checking
    - Index on received_at for chronological ordering
*/

-- Create whatsapp_messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text UNIQUE NOT NULL,
  from_number text NOT NULL,
  message_text text NOT NULL,
  timestamp text NOT NULL,
  received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_id ON whatsapp_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_received_at ON whatsapp_messages(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number ON whatsapp_messages(from_number);

-- Enable Row Level Security
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (webhook needs to work without authentication)
CREATE POLICY "Allow all operations on whatsapp_messages"
  ON whatsapp_messages
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);