CREATE TABLE public.indicator_radar_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL,
  platform_economy integer NOT NULL DEFAULT 0,
  experience_economy integer NOT NULL DEFAULT 0,
  creative_economy integer NOT NULL DEFAULT 0,
  cognitive_engineering integer NOT NULL DEFAULT 0,
  meaningful_legacy integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.indicator_radar_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert indicator responses" ON public.indicator_radar_responses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read indicator responses" ON public.indicator_radar_responses FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.indicator_radar_responses;