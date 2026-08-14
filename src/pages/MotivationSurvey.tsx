import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';
import ScaleTen from '@/components/ScaleTen';
import MotivationResults from '@/components/MotivationResults';
import { supabase } from '@/integrations/supabase/client';
import {
  MOTIVES,
  ENABLEMENT_TEST,
  SIGNIFICANCE_TEST,
  DEFAULT_TEAM_CODE,
} from '@/data/motivation-motives';

const EMPTY = () => new Array(MOTIVES.length).fill(0) as number[];

const sanitizeCode = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '').slice(0, 50);

/**
 * Опрос мотивации для участника. Командных данных здесь нет намеренно:
 * человек видит только собственный профиль, средние по команде доступны
 * администратору на /motivation/team по ключу.
 */
const MotivationSurvey = () => {
  const [searchParams] = useSearchParams();
  const codeFromLink = searchParams.get('team');

  const [teamCode, setTeamCode] = useState(
    sanitizeCode(codeFromLink ?? DEFAULT_TEAM_CODE)
  );
  const [enablement, setEnablement] = useState<number[]>(EMPTY);
  const [significance, setSignificance] = useState<number[]>(EMPTY);
  const [step, setStep] = useState<1 | 2>(1);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const test = step === 1 ? ENABLEMENT_TEST : SIGNIFICANCE_TEST;
  const values = step === 1 ? enablement : significance;
  const setValues = step === 1 ? setEnablement : setSignificance;

  const answered = values.filter((v) => v > 0).length;
  const complete = answered === MOTIVES.length;

  // Правило Теста №2: одинаковую оценку могут получить не более трёх мотивов.
  const overusedScores = useMemo(() => {
    if (step !== 2) return new Set<number>();
    const counts = new Map<number, number>();
    significance.forEach((v) => v > 0 && counts.set(v, (counts.get(v) ?? 0) + 1));
    return new Set(
      [...counts.entries()]
        .filter(([, n]) => n > SIGNIFICANCE_TEST.maxSameScore)
        .map(([score]) => score)
    );
  }, [step, significance]);

  const setAt = (index: number, value: number) =>
    setValues((prev) => prev.map((v, i) => (i === index ? value : v)));

  const handleSubmit = async () => {
    if (!teamCode) {
      toast.error('Укажите код опроса');
      return;
    }
    setSending(true);
    // .insert() без .select(): читать таблицу участникам запрещено на уровне базы
    const { error } = await supabase
      .from('motivation_responses' as any)
      .insert({ team_id: teamCode, significance, enablement } as any);
    setSending(false);

    if (error) {
      toast.error('Не удалось отправить анкету. Попробуйте ещё раз');
      return;
    }
    setSubmitted(true);
    setShowResults(true);
    toast.success('Анкета отправлена');
  };

  if (showResults) {
    return (
      <MotivationResults
        significance={significance}
        enablement={enablement}
        onBack={() => setShowResults(false)}
      />
    );
  }

  const progressPercent = Math.round((answered / MOTIVES.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-0.5 bg-border/40">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-10 lg:px-12">
        <header className="mx-auto max-w-3xl mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <BrandLogo size="lg" />
            <div className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px] md:text-xs font-medium px-2.5 py-1 rounded-full border border-border bg-card">
              <span>Шаг {step} из 2</span>
              <span className="text-border">·</span>
              <span>{MOTIVES.length} мотивов</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
            {test.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{test.question}</p>
          <p className="text-xs text-muted-foreground/80 mt-2">
            Шкала: {test.scaleHint}
          </p>
          {step === 2 && (
            <p className="text-xs text-muted-foreground/80 mt-1">
              Одинаковую оценку могут получить одновременно не более трёх мотивов.
            </p>
          )}
        </header>

        <main className="mx-auto max-w-3xl space-y-3">
          {step === 1 && (
            <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5">
              {codeFromLink ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">Код опроса</span>
                  <span className="text-xs font-medium bg-primary/8 text-primary px-2 py-0.5 rounded-md tabular-nums">
                    {teamCode}
                  </span>
                </div>
              ) : (
                <div>
                  <Label htmlFor="code" className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Код опроса
                  </Label>
                  <Input
                    id="code"
                    value={teamCode}
                    onChange={(e) => setTeamCode(sanitizeCode(e.target.value))}
                    className="bg-background border-border rounded-lg text-sm h-9 max-w-[12rem]"
                  />
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed flex gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                Ответы анонимны. Они будут использованы только в совокупности с ответами других
                участников — ни имени, ни почты анкета не собирает.
              </p>
            </div>
          )}

          {MOTIVES.map((motive, i) => {
            const value = values[i];
            const warn = step === 2 && value > 0 && overusedScores.has(value);
            return (
              <div
                key={motive.short}
                className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-semibold ${
                      value > 0 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-snug">{motive.full}</p>
                </div>
                <ScaleTen
                  value={value}
                  onChange={(v) => setAt(i, v)}
                  warn={warn}
                  ariaLabel={motive.full}
                />
                <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/70">
                  <span>1 — {test.low}</span>
                  <span>10 — {test.high}</span>
                </div>
                {warn && (
                  <p className="text-[11px] text-[hsl(var(--chart-2))] mt-2">
                    Оценку {value} вы поставили больше трёх раз — по инструкции так быть не должно.
                  </p>
                )}
              </div>
            );
          })}

          <div className="pt-3 pb-2 flex gap-2">
            {step === 2 && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep(1)}
                className="rounded-xl py-5"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Назад
              </Button>
            )}
            {step === 1 ? (
              <Button
                size="lg"
                disabled={!complete}
                onClick={() => {
                  setStep(2);
                  window.scrollTo({ top: 0 });
                }}
                className="flex-1 rounded-xl py-5 text-sm font-medium disabled:opacity-30"
              >
                Дальше — что важно вам
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            ) : submitted ? (
              <Button
                size="lg"
                onClick={() => setShowResults(true)}
                className="flex-1 rounded-xl py-5 text-sm font-medium"
              >
                Посмотреть результат
              </Button>
            ) : (
              <Button
                size="lg"
                disabled={!complete || sending}
                onClick={handleSubmit}
                className="flex-1 rounded-xl py-5 text-sm font-medium disabled:opacity-30"
              >
                <Send className="w-4 h-4 mr-1.5" />
                {sending ? 'Отправляем…' : 'Отправить и посмотреть результат'}
              </Button>
            )}
          </div>

          {!complete && (
            <p className="text-[11px] text-muted-foreground text-center pb-8">
              Отвечено {answered} из {MOTIVES.length}
            </p>
          )}
        </main>
      </div>
    </div>
  );
};

export default MotivationSurvey;
