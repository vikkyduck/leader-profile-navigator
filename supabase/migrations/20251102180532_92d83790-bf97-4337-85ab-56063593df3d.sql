-- Create team_members table to track team membership
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, team_id)
);

-- Enable RLS on team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Users can view their own team memberships
CREATE POLICY "Users can view their own team memberships"
ON public.team_members
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own team memberships
CREATE POLICY "Users can insert their own team memberships"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own team memberships
CREATE POLICY "Users can delete their own team memberships"
ON public.team_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create security definer function to check team membership
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID, _team_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

-- Drop old permissive SELECT policy on leader_responses
DROP POLICY IF EXISTS "Users can view their own responses" ON public.leader_responses;

-- Create new restrictive SELECT policy requiring team membership
CREATE POLICY "Users can view responses from their teams"
ON public.leader_responses
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  public.is_team_member(auth.uid(), team_id)
);