
CREATE TABLE public.blue_ocean_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  market INTEGER NOT NULL DEFAULT 0,
  client INTEGER NOT NULL DEFAULT 0,
  product INTEGER NOT NULL DEFAULT 0,
  economics INTEGER NOT NULL DEFAULT 0,
  uniqueness INTEGER NOT NULL DEFAULT 0,
  sustainability INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.blue_ocean_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert blue ocean responses"
ON public.blue_ocean_responses FOR INSERT
TO public WITH CHECK (true);

CREATE POLICY "Anyone can read blue ocean responses"
ON public.blue_ocean_responses FOR SELECT
TO public USING (true);
