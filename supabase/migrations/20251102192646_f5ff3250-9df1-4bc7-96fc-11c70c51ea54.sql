-- Drop old tables and policies
DROP TABLE IF EXISTS public.leader_responses CASCADE;
DROP TABLE IF EXISTS public.team_members CASCADE;
DROP FUNCTION IF EXISTS public.is_team_member CASCADE;
DROP FUNCTION IF EXISTS public.update_leader_responses_updated_at CASCADE;

-- Create simple anonymous responses table
CREATE TABLE public.anonymous_team_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL,
  courage integer NOT NULL DEFAULT 0 CHECK (courage >= 0 AND courage <= 10),
  hiring integer NOT NULL DEFAULT 0 CHECK (hiring >= 0 AND hiring <= 10),
  responsibility integer NOT NULL DEFAULT 0 CHECK (responsibility >= 0 AND responsibility <= 10),
  integration integer NOT NULL DEFAULT 0 CHECK (integration >= 0 AND integration <= 10),
  sincerity integer NOT NULL DEFAULT 0 CHECK (sincerity >= 0 AND sincerity <= 10),
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.anonymous_team_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert and read (no auth required)
CREATE POLICY "Anyone can insert responses" 
ON public.anonymous_team_responses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read responses" 
ON public.anonymous_team_responses 
FOR SELECT 
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_team_responses;