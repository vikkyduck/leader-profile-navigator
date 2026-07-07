-- Create table for storing leader profile responses
CREATE TABLE IF NOT EXISTS public.leader_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL,
  user_id uuid DEFAULT gen_random_uuid(),
  courage int NOT NULL DEFAULT 0,
  hiring int NOT NULL DEFAULT 0,
  responsibility int NOT NULL DEFAULT 0,
  integration int NOT NULL DEFAULT 0,
  sincerity int NOT NULL DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leader_responses ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read all responses (for team statistics)
CREATE POLICY "Anyone can read responses"
  ON public.leader_responses
  FOR SELECT
  USING (true);

-- Allow anyone to insert their own response
CREATE POLICY "Anyone can insert responses"
  ON public.leader_responses
  FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update their own response
CREATE POLICY "Anyone can update responses"
  ON public.leader_responses
  FOR UPDATE
  USING (true);

-- Create index for faster team queries
CREATE INDEX IF NOT EXISTS idx_leader_responses_team_id 
  ON public.leader_responses(team_id);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.leader_responses;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_leader_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leader_responses_timestamp
  BEFORE UPDATE ON public.leader_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leader_responses_updated_at();