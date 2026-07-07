-- Add reflection_notes field to leader_responses
ALTER TABLE public.leader_responses
ADD COLUMN reflection_notes TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.leader_responses.reflection_notes IS 'User notes about what they want to develop after completing the assessment';