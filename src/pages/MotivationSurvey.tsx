import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, BarChart3, ChevronDown, Send, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';
import ScaleTen from '@/components/ScaleTen';
import DualRadarChart from '@/components/DualRadarChart';
import MotivationResults from '@/components/MotivationResults';
import { submitResponse } from '@/lib/api';
import {
  MOTIVES,
  MOTIVES_HEADING,
  SURVEY_INTRO,
  ENABLEMENT_TEST,
  SIGNIFICANCE_TEST,
  DEFAULT_TEAM_CODE,
} from '@/data/motivation-motives';

const EMPTY = () => new Array(MOTIVES.length).fill(0) as number[];

const sanitizeCode = (v: string) =>
  v.toLowerCase().trim().replace(/[^a-z0-9\-]/g, '').slice(0, 50);

/** Сколько раз оценка уже стоит в наборе, не считая позицию index. */
const countScore = (values: number[], score: number, index: number) =>
  values.filter((v, i) => i !== index && v === score).length;

/**
 * Опрос мотивации для участника. Командных данных здесь нет намеренно:
 * человек видит только собственный профиль, средние по команде доступны
 * администратору на /motivation/team по ключу.
 */
const MotivationSurvey = () => {
  const [searchParams] = useSearchParams();
  const codeFromLink = searchParams.get('team');

  const [teamCode, setTeamCode] = useState(sanitizeCode(codeFromLink ?? DEFAULT_TEAM_CODE));
  const [enablement, setEnablement] = useState<number[]>(EMPTY);
  const [significance, setSignificance] = useState<number[]>(EMPTY);
  const [step, setStep] = useState<1 | 2>(1);
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMobileRadar, setShowMobileRadar] = useState(false);
  /** Какой мотив только что упёрся в лимит — чтобы объяснить прямо в карточке */
  const [refused, setRefused] = useState<{ index: number; score: number } | null>(null);

  const test = step === 1 ? ENABLEMENT_TEST : SIGNIFICANCE_TEST;
  const values = step === 1 ? enablement : significance;
  const setValues = step === 1 ? setEnablement : setSignificance;

  const answered = values.filter((v) => v > 0).length;
  const complete = answered === MOTIVES.length;

  /** Сколько раз каждая оценка уже стоит в Тесте №2 (индекс = сама оценка) */
  const scoreUsage = useMemo(() => {
    const counts = new Array(11).fill(0) as number[];
    if (step === 2) significance.forEach((v) => v > 0 && counts[v]++);
    return counts;
  }, [step, significance]);

  const exhausted = useMemo(
    () =>
      new Set(
        scoreUsage
          .map((n, score) => (n >= SIGNIFICANCE_TEST.maxSameScore ? score : -1))
          .filter((score) => score > 0)
      ),
    [scoreUsage]
  );

  const setAt = (index: number, value: number) => {
    // Жёсткое ограничение методики для Теста №2: одна и та же оценка
    // не может стоять больше трёх раз, поэтому четвёртую просто не ставим.
    if (step === 2 && countScore(significance, value, index) >= SIGNIFICANCE_TEST.maxSameScore) {
      setRefused({ index, score: value });
      toast.error(
        `Оценка ${value} уже стоит у трёх мотивов — по инструкции больше нельзя. Выберите другую.`
      );
      return;
    }
    setRefused(null);
    setValues((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const handleSubmit = async () => {
    if (!teamCode) {
      toast.error('Укажите код опроса');
      return;
    }
    setSending(true);
    try {
      // Читать чужие ответы участнику нельзя — средние сервер отдаёт только по ключу
      await submitResponse('motivation', teamCode, { significance, enablement });
    } catch (e) {
      toast.error((e as Error).message || 'Не удалось отправить анкету. Попробуйте ещё раз');
      return;
    } finally {
      setSending(false);
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

  /** Наглядный «остаток» оценок: видно до клика, что 8 уже израсходована */
  const budgetPanel =
    step === 2 ? (
      <div className="bg-card rounded-xl border border-border card-shadow p-4">
        <div className="flex items-baseline justify-between mb-2 gap-2">
          <span className="text-xs font-semibold text-foreground">Использовано оценок</span>
          <span className="text-[11px] text-muted-foreground">
            не более {SIGNIFICANCE_TEST.maxSameScore} раз каждую
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const used = scoreUsage[n];
            const full = used >= SIGNIFICANCE_TEST.maxSameScore;
            return (
              <div
                key={n}
                className={`px-2 py-1 rounded-lg border text-[11px] tabular-nums ${
                  full
                    ? 'bg-muted/40 text-muted-foreground/50 border-border/40 line-through'
                    : used > 0
                      ? 'bg-primary/8 text-primary border-primary/20'
                      : 'bg-background text-muted-foreground border-border'
                }`}
              >
                <span className="font-semibold">{n}</span>
                <span className="opacity-70">
                  {' '}
                  {used}/{SIGNIFICANCE_TEST.maxSameScore}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    ) : null;

  const radar = (
    <DualRadarChart
      labels={MOTIVES.map((m) => m.short)}
      seriesA={{ name: SIGNIFICANCE_TEST.seriesName, values: significance }}
      seriesB={{ name: ENABLEMENT_TEST.seriesName, values: enablement }}
      title="Ваш профиль"
    />
  );

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
        <header className="mx-auto max-w-5xl mb-6 md:mb-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <BrandLogo size="lg" />
            <div className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px] md:text-xs font-medium px-2.5 py-1 rounded-full border border-border bg-card">
              <span>Шаг {step} из 2</span>
              <span className="text-border">·</span>
              <span>{MOTIVES.length} мотивов</span>
            </div>
          </div>

          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {test.title}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight mt-1">
            {test.heading}
          </h1>
          <div className="mt-3 space-y-2 max-w-2xl">
            <p className="text-sm text-foreground/80 leading-relaxed">{test.intro}</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{test.question}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{test.scale}</p>
            {test.rule && (
              <p className="text-sm text-muted-foreground leading-relaxed">{test.rule}</p>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_2.05fr] gap-4 md:gap-6">
            {/* Паутинка обновляется по ходу заполнения — это личные данные
                участника, командных чисел здесь нет */}
            <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start space-y-3">
              <div className="bg-card rounded-xl border border-border card-shadow p-4 h-[24rem]">
                {radar}
              </div>

              <div className="bg-card rounded-xl border border-border card-shadow p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Прогресс</span>
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {answered}/{MOTIVES.length}
                  </span>
                </div>
                {codeFromLink ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Код опроса</span>
                    <span className="text-xs font-medium bg-primary/8 text-primary px-2 py-0.5 rounded-md tabular-nums">
                      {teamCode}
                    </span>
                  </div>
                ) : (
                  <div>
                    <Label
                      htmlFor="code"
                      className="text-xs font-medium text-muted-foreground mb-1.5 block"
                    >
                      Код опроса
                    </Label>
                    <Input
                      id="code"
                      value={teamCode}
                      onChange={(e) => setTeamCode(sanitizeCode(e.target.value))}
                      className="bg-background border-border rounded-lg text-sm h-9"
                    />
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground leading-relaxed flex gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {SURVEY_INTRO}
                </p>
              </div>

              {budgetPanel}
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{MOTIVES_HEADING}</h2>

              {step === 2 && (
                <>
                  <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {SIGNIFICANCE_TEST.rule} Израсходованные оценки гаснут и зачёркиваются —
                      поставить их четвёртый раз нельзя.
                    </p>
                  </div>
                  <div className="lg:hidden">{budgetPanel}</div>
                </>
              )}

              {MOTIVES.map((motive, i) => {
                const value = values[i];
                return (
                  <div
                    key={motive.short}
                    className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-semibold ${
                          value > 0
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <p className="text-sm text-foreground leading-snug">{motive.full}</p>
                    </div>
                    <ScaleTen
                      value={value}
                      onChange={(v) => setAt(i, v)}
                      exhausted={step === 2 ? exhausted : undefined}
                      ariaLabel={motive.full}
                    />
                    <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/70">
                      <span>1 — {test.low}</span>
                      <span>10 — {test.high}</span>
                    </div>
                    {refused?.index === i && (
                      <p className="text-[11px] text-destructive mt-2 leading-snug">
                        Оценка {refused.score} уже стоит у трёх мотивов — по инструкции больше
                        нельзя. Выберите другую.
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Мобильная паутинка */}
              <div className="lg:hidden">
                <button
                  onClick={() => setShowMobileRadar(!showMobileRadar)}
                  className="w-full bg-card rounded-xl border border-border card-shadow p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-foreground block">Ваш профиль</span>
                      <span className="text-[11px] text-muted-foreground">
                        Отвечено {answered} из {MOTIVES.length}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      showMobileRadar ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {showMobileRadar && (
                  <div className="bg-card rounded-xl border border-border card-shadow p-4 mt-2 h-80">
                    {radar}
                  </div>
                )}
              </div>

              {!codeFromLink && (
                <div className="lg:hidden bg-card rounded-xl border border-border card-shadow p-4">
                  <Label
                    htmlFor="code-mobile"
                    className="text-xs font-medium text-muted-foreground mb-1.5 block"
                  >
                    Код опроса
                  </Label>
                  <Input
                    id="code-mobile"
                    value={teamCode}
                    onChange={(e) => setTeamCode(sanitizeCode(e.target.value))}
                    className="bg-background border-border rounded-lg text-sm h-9 max-w-[12rem]"
                  />
                </div>
              )}

              <div className="pt-3 pb-2 flex gap-2">
                {step === 2 && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setStep(1);
                      window.scrollTo({ top: 0 });
                    }}
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
                    Перейти к Тесту №2
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MotivationSurvey;
