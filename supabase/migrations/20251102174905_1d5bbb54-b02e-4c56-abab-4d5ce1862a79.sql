-- Drop trigger first, then function, then recreate both with proper search_path
DROP TRIGGER IF EXISTS update_leader_responses_timestamp ON public.leader_responses;
DROP FUNCTION IF EXISTS public.update_leader_responses_updated_at() CASCADE;

-- Create function with proper search_path
CREATE OR REPLACE FUNCTION public.update_leader_responses_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_leader_responses_timestamp
  BEFORE UPDATE ON public.leader_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leader_responses_updated_at();