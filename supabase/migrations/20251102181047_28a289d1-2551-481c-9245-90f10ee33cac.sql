-- Add unique constraint on user_id and team_id combination
-- This allows users to have only one response per team
ALTER TABLE public.leader_responses
ADD CONSTRAINT leader_responses_user_team_unique UNIQUE (user_id, team_id);