CREATE TABLE public.resource_radar_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL,
  visionary integer NOT NULL DEFAULT 0,
  deep_worker integer NOT NULL DEFAULT 0,
  empath integer NOT NULL DEFAULT 0,
  biohacker integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.resource_radar_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert resource radar responses"
  ON public.resource_radar_responses
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read resource radar responses"
  ON public.resource_radar_responses
  FOR SELECT
  TO public
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.resource_radar_responses;