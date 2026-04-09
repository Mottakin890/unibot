-- Add Q&A pair support as a structured data source type
-- Also add source column to conversations for tracking origin

-- Add source tracking to conversations if not already there
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'conversations' AND column_name = 'source'
  ) THEN
    ALTER TABLE public.conversations ADD COLUMN source text DEFAULT 'playground';
  END IF;
END $$;

-- Create index on conversations for analytics queries
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_source ON public.conversations(source);
