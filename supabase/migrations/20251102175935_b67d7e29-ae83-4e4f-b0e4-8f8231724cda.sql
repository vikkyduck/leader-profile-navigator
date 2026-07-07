-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.leader_responses;
DROP POLICY IF EXISTS "Anyone can read responses" ON public.leader_responses;
DROP POLICY IF EXISTS "Anyone can update responses" ON public.leader_responses;

-- Update user_id column to reference auth.users and remove default
ALTER TABLE public.leader_responses 
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN user_id DROP DEFAULT;

-- Create policies that restrict access to authenticated users' own data
CREATE POLICY "Users can view their own responses"
  ON public.leader_responses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON public.leader_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own responses"
  ON public.leader_responses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own responses"
  ON public.leader_responses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);