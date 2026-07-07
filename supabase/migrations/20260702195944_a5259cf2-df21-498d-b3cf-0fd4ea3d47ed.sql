
CREATE TABLE public.edtech_risk_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id text NOT NULL,
  regulatory integer NOT NULL DEFAULT 0,
  product integer NOT NULL DEFAULT 0,
  technology integer NOT NULL DEFAULT 0,
  data_privacy integer NOT NULL DEFAULT 0,
  financial integer NOT NULL DEFAULT 0,
  reputation integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.edtech_risk_responses TO anon;
GRANT SELECT, INSERT ON public.edtech_risk_responses TO authenticated;
GRANT ALL ON public.edtech_risk_responses TO service_role;

ALTER TABLE public.edtech_risk_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert edtech risk responses"
  ON public.edtech_risk_responses FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can read edtech risk responses"
  ON public.edtech_risk_responses FOR SELECT TO public USING (true);
