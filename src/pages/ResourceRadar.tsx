import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LeaderRadarChart from '@/components/LeaderRadarChart';
import TeamControls from '@/components/TeamControls';
import { Quality } from '@/types/leader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, RotateCcw, Eye, ChevronDown, BarChart3, ChevronRight } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import InstrumentNav from '@/components/InstrumentNav';
import BrandLogo from '@/components/BrandLogo';
import { resourceRadarConfig } from '@/data/resource-radar';
import ResourceRadarResults from '@/components/ResourceRadarResults';
import { Checkbox } from '@/components/ui/checkbox';

const ResourceRadar = () => {
  const config = resourceRadarConfig;
  const { toast } = useToast();
  const { qualities: qualitiesData } = config;

  const [qualities, setQualities] = useState<Quality[]>(
    qualitiesData.map((q) => ({ id: q.id, label: q.label, score: 0 })),
  );
  const [checkedState, setCheckedState] = useState<{ [key: string]: boolean[] }>(
    qualitiesData.reduce(
      (acc, q) => ({ ...acc, [q.id]: new Array(q.criteria.length).fill(false) }),
      {},
    ),
  );
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({});
  const [teamId, setTeamId] = useState('');
  const [responseCount, setResponseCount] = useState(0);
  const [teamAverage, setTeamAverage] = useState<number[]>([]);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMobileRadar, setShowMobileRadar] = useState(false);

  useEffect(() => {
    if (!teamId) return;

    const channel = supabase
      .channel(`${config.id}-${teamId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: config.tableName,
          filter: `team_id=eq.${teamId}`,
        },
        () => loadTeamData(),
      )
      .subscribe();

    loadTeamData();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;
    try {
      const { data, error } = await supabase
        .from(config.tableName as any)
        .select('*')
        .eq('team_id', teamId);
      if (error) {
        sonnerToast.error('Не удалось загрузить данные команды');
        return;
      }
      if (data) {
        setResponseCount(data.length);
        if (data.length > 0) {
          const averages = qualitiesData.map((q) => {
            const sum = (data as any[]).reduce((acc, r) => acc + (r[q.id] || 0), 0);
            return sum / data.length;
          });
          setTeamAverage(averages);
        } else {
          setTeamAverage([]);
        }
      }
    } catch {
      sonnerToast.error('Произошла ошибка');
    }
  };

  const handleCriteriaChange = (qualityId: string, criterionIndex: number, checked: boolean) => {
    setCheckedState((prev) => {
      const next = { ...prev };
      next[qualityId] = [...next[qualityId]];
      next[qualityId][criterionIndex] = checked;

      const qualityData = qualitiesData.find((q) => q.id === qualityId)!;
      const checkedCount = next[qualityId].filter(Boolean).length;
      const normalizedScore = Math.round((checkedCount / qualityData.criteria.length) * 10);

      setQualities((qs) =>
        qs.map((q) => (q.id === qualityId ? { ...q, score: normalizedScore } : q)),
      );
      return next;
    });
  };

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }
    setQualities(qualitiesData.map((q) => ({ id: q.id, label: q.label, score: 0 })));
    setCheckedState(
      qualitiesData.reduce(
        (acc, q) => ({ ...acc, [q.id]: new Array(q.criteria.length).fill(false) }),
        {},
      ),
    );
    setResetConfirm(false);
    toast({ title: 'Форма очищена', description: 'Все ответы сброшены' });
  };

  const handleSubmitResponses = async () => {
    if (!teamId) {
      toast({ title: 'Ошибка', description: 'Сначала введите ID команды', variant: 'destructive' });
      return;
    }
    const responseData: Record<string, any> = { team_id: teamId };
    for (const q of qualitiesData) {
      responseData[q.id] = qualities.find((qv) => qv.id === q.id)?.score || 0;
    }
    const { error } = await supabase.from(config.tableName as any).insert(responseData);
    if (error) {
      toast({ title: 'Ошибка', description: 'Не удалось отправить ответы', variant: 'destructive' });
    } else {
      toast({ title: 'Готово', description: 'Ваши ответы добавлены в командный портрет' });
      handleReset();
      // Realtime-канал может быть выключен на таблице — перечитываем сами,
      // иначе счётчик участников и среднее не обновляются до перезахода
      loadTeamData();
    }
  };

  const hasAnyChecked = Object.values(checkedState).some((arr) => arr.some(Boolean));
  // Командную карту можно смотреть и без своих ответов — достаточно ID команды,
  // по которому уже есть оценки
  const hasTeamData = teamId.length > 0 && responseCount > 0 && teamAverage.length > 0;

  if (showResults) {
    return (
      <ResourceRadarResults
        qualities={qualities}
        config={config}
        checkedState={checkedState}
        teamAverage={teamAverage}
        responseCount={responseCount}
        teamId={teamId}
        onBack={() => setShowResults(false)}
      />
    );
  }

  const totalBlocks = qualitiesData.length;
  const filledBlocks = qualitiesData.filter((q) => checkedState[q.id]?.some(Boolean)).length;
  const progressPercent = Math.round((filledBlocks / totalBlocks) * 100);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-0.5 bg-border/40">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-10 lg:px-12 pt-4 md:pt-8">
        <header className="mx-auto max-w-5xl mb-8 md:mb-12">
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <BrandLogo size="lg" className="lg:hidden" />
              <BrandLogo size="xl" className="hidden lg:inline-flex" />
              <div className="flex items-center gap-3">
                <InstrumentNav />
                <div className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px] md:text-xs font-medium px-2.5 py-1 rounded-full border border-border bg-card">
                  <span>{totalBlocks} блока · 36 утверждений</span>
                  <span className="text-border">·</span>
                  <span>~5 мин</span>
                </div>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground leading-tight">
              {config.title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {config.subtitle}
            </p>
            <p className="text-xs md:text-sm text-foreground/70 mt-3 max-w-2xl">
              Отметьте «Да» по каждому утверждению, которое про вас. Ответы сложатся в карту ваших источников энергии, а доминирующий блок раскроет ваш архетип восстановления.
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.4fr] gap-4 md:gap-6">
            {/* Sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start space-y-3">
              <div className="bg-card rounded-xl border border-border card-shadow p-4 h-[20rem] animate-fade-up">
                <LeaderRadarChart
                  qualities={qualities}
                  title="Карта ресурсов"
                  teamAverage={teamAverage}
                  showTeamData={teamId.length > 0}
                />
              </div>

              <div className="bg-card rounded-xl border border-border card-shadow p-4 animate-fade-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-foreground">Прогресс</span>
                  <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {filledBlocks}/{totalBlocks}
                  </span>
                </div>
                <div className="space-y-2">
                  {qualitiesData.map((q, i) => {
                    const checked = checkedState[q.id]?.filter(Boolean).length || 0;
                    const total = q.criteria.length;
                    const done = checked === total && total > 0;
                    return (
                      <div key={q.id} className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-semibold ${
                            done
                              ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]'
                              : checked > 0
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {done ? '✓' : i + 1}
                        </div>
                        <span
                          className={`text-[11px] truncate flex-1 ${
                            done ? 'text-foreground font-medium' : 'text-muted-foreground'
                          }`}
                        >
                          {q.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {checked}/{total}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <TeamControls
                teamId={teamId}
                teamMemberCount={responseCount}
                onTeamIdChange={setTeamId}
              />
            </div>

            {/* Main */}
            <div className="space-y-3">
              {qualitiesData.map((quality, index) => {
                const checked = checkedState[quality.id] || [];
                const checkedCount = checked.filter(Boolean).length;
                const total = quality.criteria.length;
                const isOpen = openBlocks[quality.id] ?? index === 0;

                return (
                  <div
                    key={quality.id}
                    className="bg-card rounded-xl border border-border card-shadow overflow-hidden animate-fade-up"
                    style={{ animationDelay: `${(index + 1) * 50}ms` }}
                  >
                    <button
                      onClick={() => setOpenBlocks((p) => ({ ...p, [quality.id]: !isOpen }))}
                      className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${
                            checkedCount === total
                              ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]'
                              : checkedCount > 0
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {checkedCount === total ? '✓' : index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm md:text-base font-semibold text-foreground truncate">
                            {quality.label}
                          </h3>
                          <p className="text-[11px] md:text-xs text-muted-foreground truncate">
                            {quality.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span className="text-[11px] text-muted-foreground tabular-nums">
                          {checkedCount}/{total}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border/60 divide-y divide-border/40">
                        {quality.criteria.map((c, i) => {
                          const isChecked = checked[i] || false;
                          const inputId = `${quality.id}-${i}`;
                          return (
                            <label
                              key={i}
                              htmlFor={inputId}
                              className="flex items-start gap-3 p-3 md:p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                            >
                              <Checkbox
                                id={inputId}
                                checked={isChecked}
                                onCheckedChange={(v) =>
                                  handleCriteriaChange(quality.id, i, v === true)
                                }
                                className="mt-0.5"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] md:text-sm font-medium text-foreground">
                                  {c.title}
                                </p>
                                <p className="text-xs md:text-[13px] text-muted-foreground mt-0.5 leading-relaxed">
                                  {c.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile radar toggle */}
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
                      <span className="text-sm font-medium text-foreground block">Карта ресурсов</span>
                      <span className="text-[11px] text-muted-foreground">
                        {hasAnyChecked ? `${filledBlocks}/${totalBlocks} блоков` : 'Нажмите, чтобы посмотреть'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform ${showMobileRadar ? 'rotate-180' : ''}`}
                  />
                </button>
                {showMobileRadar && (
                  <div className="bg-card rounded-xl border border-border card-shadow p-4 mt-2 h-64">
                    <LeaderRadarChart
                      qualities={qualities}
                      title="Карта ресурсов"
                      teamAverage={teamAverage}
                      showTeamData={teamId.length > 0}
                    />
                  </div>
                )}
              </div>

              <div className="lg:hidden">
                <TeamControls
                  teamId={teamId}
                  teamMemberCount={responseCount}
                  onTeamIdChange={setTeamId}
                />
              </div>

              <div className="pt-3 pb-2">
                {teamId && hasAnyChecked && (
                  <Button
                    onClick={handleSubmitResponses}
                    variant="outline"
                    size="lg"
                    className="w-full text-sm py-5 rounded-xl font-medium"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Отправить в командный портрет
                  </Button>
                )}
              </div>
            </div>
          </div>
        </main>

        <div
          className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ${
            hasAnyChecked || hasTeamData ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}
        >
          <div className="glass border-t border-border/60 px-4 py-2.5 md:px-6 md:py-3">
            <div className="mx-auto max-w-5xl flex gap-2">
              <Button
                onClick={() => setShowResults(true)}
                size="lg"
                className="flex-1 text-sm py-4 md:py-5 rounded-xl font-medium"
              >
                <Eye className="w-4 h-4 mr-1.5" />
                {!hasAnyChecked && hasTeamData
                  ? 'Карта команды'
                  : filledBlocks < totalBlocks
                    ? `Карта (${filledBlocks}/${totalBlocks})`
                    : 'Карта ресурсов'}
              </Button>
              <Button
                onClick={handleReset}
                variant={resetConfirm ? 'destructive' : 'outline'}
                size="lg"
                className="py-4 md:py-5 rounded-xl px-3"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">
                  {resetConfirm ? 'Точно?' : 'Сбросить'}
                </span>
              </Button>
            </div>
          </div>
        </div>

        {(hasAnyChecked || hasTeamData) && <div className="h-20" />}
      </div>
    </div>
  );
};

export default ResourceRadar;
