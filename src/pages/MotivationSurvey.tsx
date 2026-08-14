import { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
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

  const test = step === 1 ? ENABLEMENT_TEST : SIGNIFICANCE_TEST;
  const values = step === 1 ? enablement : significance;
  const setValues = step === 1 ? setEnablement : setSignificance;

  const answered = values.filter((v) => v > 0).length;
  const complete = answered === MOTIVES.length;

  const setAt = (index: number, value: number) => {
    // Жёсткое ограничение методики для Теста №2: одна и та же оценка
    // не может стоять больше трёх раз, поэтому четвёртую просто не ставим.
    if (step === 2 && countScore(significance, value, index) >= SIGNIFICANCE_TEST.maxSameScore) {
      toast.error(
        `Оценка ${value} уже стоит у трёх мотивов — по инструкции больше нельзя. Выберите другую.`
      );
      return;
    }
    setValues((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

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

          <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
            {test.title}
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
            </div>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{MOTIVES_HEADING}</h2>

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
                    <ScaleTen value={value} onChange={(v) => setAt(i, v)} ariaLabel={motive.full} />
                    <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground/70">
                      <span>1 — {test.low}</span>
                      <span>10 — {test.high}</span>
                    </div>
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
