-- Радар мотивации: 15 мотивов, две шкалы 1–10.
--   enablement   — Тест №1: насколько компания способствует реализации мотива
--   significance — Тест №2: насколько мотив значим лично для человека
--
-- Отличие от остальных инструментов: участник НЕ должен видеть чужие ответы и
-- командное среднее. Поэтому читать таблицу анониму запрещено совсем — ни одной
-- SELECT-политики нет и права на SELECT отозваны. Данные достаёт только админ
-- через функции ниже, и только предъявив ключ из motivation_admin.

CREATE TABLE IF NOT EXISTS public.motivation_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id text NOT NULL,
  significance smallint[] NOT NULL,
  enablement smallint[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT significance_len CHECK (array_length(significance, 1) = 15),
  CONSTRAINT enablement_len CHECK (array_length(enablement, 1) = 15),
  CONSTRAINT significance_range CHECK (significance <@ ARRAY[1,2,3,4,5,6,7,8,9,10]::smallint[]),
  CONSTRAINT enablement_range CHECK (enablement <@ ARRAY[1,2,3,4,5,6,7,8,9,10]::smallint[])
);

CREATE INDEX IF NOT EXISTS idx_motivation_team_id ON public.motivation_responses(team_id);

ALTER TABLE public.motivation_responses ENABLE ROW LEVEL SECURITY;

-- Только запись. SELECT не выдаём даже на уровне грантов.
REVOKE ALL ON public.motivation_responses FROM anon, authenticated;
GRANT INSERT ON public.motivation_responses TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can submit motivation answers" ON public.motivation_responses;
CREATE POLICY "Anyone can submit motivation answers"
  ON public.motivation_responses FOR INSERT
  TO public WITH CHECK (true);

-- Ключ доступа администратора. Таблица без политик и без прав — из браузера
-- она недоступна ни на чтение, ни на запись.
CREATE TABLE IF NOT EXISTS public.motivation_admin (
  secret text PRIMARY KEY
);
ALTER TABLE public.motivation_admin ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.motivation_admin FROM anon, authenticated;

-- Средние по команде: одна строка на команду, по 15 значений в каждой шкале.
CREATE OR REPLACE FUNCTION public.motivation_summary(p_secret text, p_team text DEFAULT NULL)
RETURNS TABLE (team_id text, responses int, significance numeric[], enablement numeric[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM motivation_admin a WHERE a.secret = p_secret) THEN
    RAISE EXCEPTION 'Неверный ключ доступа' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH per_axis AS (
    SELECT r.team_id AS t, g.i AS i,
           round(avg(r.significance[g.i])::numeric, 2) AS sig,
           round(avg(r.enablement[g.i])::numeric, 2) AS ena
    FROM motivation_responses r, generate_series(1, 15) g(i)
    WHERE p_team IS NULL OR r.team_id = p_team
    GROUP BY r.team_id, g.i
  ), counts AS (
    SELECT r.team_id AS t, count(*)::int AS n
    FROM motivation_responses r
    WHERE p_team IS NULL OR r.team_id = p_team
    GROUP BY r.team_id
  )
  SELECT c.t, c.n,
         (SELECT array_agg(p.sig ORDER BY p.i) FROM per_axis p WHERE p.t = c.t),
         (SELECT array_agg(p.ena ORDER BY p.i) FROM per_axis p WHERE p.t = c.t)
  FROM counts c
  ORDER BY c.t;
END;
$$;

-- Построчная выгрузка анкет — обезличенная: ни имени, ни IP в таблице нет.
CREATE OR REPLACE FUNCTION public.motivation_rows(p_secret text, p_team text DEFAULT NULL)
RETURNS TABLE (team_id text, created_at timestamptz, significance smallint[], enablement smallint[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM motivation_admin a WHERE a.secret = p_secret) THEN
    RAISE EXCEPTION 'Неверный ключ доступа' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT r.team_id, r.created_at, r.significance, r.enablement
  FROM motivation_responses r
  WHERE p_team IS NULL OR r.team_id = p_team
  ORDER BY r.team_id, r.created_at;
END;
$$;

REVOKE ALL ON FUNCTION public.motivation_summary(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.motivation_rows(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.motivation_summary(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.motivation_rows(text, text) TO anon, authenticated;

-- Ключ доступа сюда НЕ коммитим: репозиторий публичный.
-- Отдельной строкой в SQL-редакторе:
--   INSERT INTO public.motivation_admin(secret) VALUES ('<ключ>');
