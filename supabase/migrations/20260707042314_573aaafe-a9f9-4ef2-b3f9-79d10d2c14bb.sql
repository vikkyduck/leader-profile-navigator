DROP TABLE IF EXISTS public.edtech_risk_responses;

CREATE TABLE public.edtech_risk_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id text NOT NULL,
  antifragile integer NOT NULL DEFAULT 0,
  portfolio integer NOT NULL DEFAULT 0,
  cheap_bets integer NOT NULL DEFAULT 0,
  risk_map integer NOT NULL DEFAULT 0,
  switching_cost integer NOT NULL DEFAULT 0,
  focus_core integer NOT NULL DEFAULT 0,
  formed_demand integer NOT NULL DEFAULT 0,
  free_resource integer NOT NULL DEFAULT 0,
  crisis_playbook integer NOT NULL DEFAULT 0,
  early_signals integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.edtech_risk_responses TO anon;
GRANT SELECT, INSERT ON public.edtech_risk_responses TO authenticated;
GRANT ALL ON public.edtech_risk_responses TO service_role;

ALTER TABLE public.edtech_risk_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read responses by team_id"
  ON public.edtech_risk_responses FOR SELECT
  USING (true);

CREATE POLICY "Public can insert responses"
  ON public.edtech_risk_responses FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_edtech_risk_team_id ON public.edtech_risk_responses(team_id);