import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import LeaderRadarChart from '@/components/LeaderRadarChart';
import QualitySection from '@/components/QualitySection';
import TeamControls from '@/components/TeamControls';
import ScaleLegend from '@/components/ScaleLegend';

import { Quality } from '@/types/leader';
import { InstrumentConfig } from '@/types/instrument';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, RotateCcw, Eye, ChevronDown, BarChart3 } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import BlueOceanResults from '@/components/BlueOceanResults';
import EdTechRiskResults from '@/components/EdTechRiskResults';
import InstrumentNav from '@/components/InstrumentNav';
import BrandLogo from '@/components/BrandLogo';

interface AssessmentPageProps {
  config: InstrumentConfig;
}

const AssessmentPage = ({ config }: AssessmentPageProps) => {
  const { toast } = useToast();
  const { qualities: qualitiesData } = config;

  const [qualities, setQualities] = useState<Quality[]>(
    qualitiesData.map(q => ({ id: q.id, label: q.label, score: 0 }))
  );
  const [checkedState, setCheckedState] = useState<{ [key: string]: boolean[] }>(
    qualitiesData.reduce((acc, q) => ({
      ...acc,
      [q.id]: new Array(q.criteria.length).fill(false)
    }), {})
  );
  const [teamId, setTeamId] = useState('');
  const [responseCount, setResponseCount] = useState(0);
  const [teamAverage, setTeamAverage] = useState<number[]>([]);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMobileRadar, setShowMobileRadar] = useState(false);
  const [shownMultiSelectHint, setShownMultiSelectHint] = useState(false);

  const handleFirstBlockOpen = () => {
    if (!shownMultiSelectHint) {
      setShownMultiSelectHint(true);
      sonnerToast.info('Отмечайте все пункты, которые подходят вашему бизнесу', {
        duration: 4000,
      });
    }
  };

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
        () => {
          loadTeamData();
        }
      )
      .subscribe();

    loadTeamData();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  const loadTeamData = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from(config.tableName as any)
        .select('*')
        .eq('team_id', teamId);

      if (error) {
        if (import.meta.env.DEV) console.error('DB Error:', error.code);
        sonnerToast.error('Не удалось загрузить данные команды');
        return;
      }

      if (data) {
        setResponseCount(data.length);

        if (data.length > 0) {
          const averages = qualitiesData.map(q => {
            const sum = (data as any[]).reduce((acc, response) => acc + (response[q.id] || 0), 0);
            return sum / data.length;
          });
          setTeamAverage(averages);
        } else {
          setTeamAverage([]);
        }
      }
    } catch {
      if (import.meta.env.DEV) console.error('Error loading team data');
      sonnerToast.error('Произошла ошибка');
    }
  };

  const handleCriteriaChange = (qualityId: string, criterionIndex: number, checked: boolean) => {
    setCheckedState(prev => {
      const newState = { ...prev };
      newState[qualityId] = [...newState[qualityId]];
      newState[qualityId][criterionIndex] = checked;
      return newState;
    });

    setQualities(prev => {
      const newQualities = [...prev];
      const qualityIndex = newQualities.findIndex(q => q.id === qualityId);
      if (qualityIndex !== -1) {
        const qualityData = qualitiesData.find(q => q.id === qualityId)!;
        const totalCriteria = qualityData.criteria.length;
        const checkedCount = checkedState[qualityId].filter((_, i) =>
          i === criterionIndex ? checked : checkedState[qualityId][i]
        ).length;
        const normalizedScore = Math.round((checkedCount / totalCriteria) * 10);
        newQualities[qualityIndex] = {
          ...newQualities[qualityIndex],
          score: normalizedScore,
        };
      }
      return newQualities;
    });
  };

  const handleReset = () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      setTimeout(() => setResetConfirm(false), 3000);
      return;
    }

    setQualities(qualitiesData.map(q => ({ id: q.id, label: q.label, score: 0 })));
    setCheckedState(
      qualitiesData.reduce((acc, q) => ({
        ...acc,
        [q.id]: new Array(q.criteria.length).fill(false)
      }), {})
    );
    setResetConfirm(false);

    toast({
      title: "Форма очищена",
      description: "Все данные сброшены",
    });
  };

  const handleSubmitResponses = async () => {
    if (!teamId) {
      toast({
        title: "Ошибка",
        description: "Сначала введите ID команды",
        variant: "destructive",
      });
      return;
    }

    const responseData: Record<string, any> = { team_id: teamId };
    for (const q of qualitiesData) {
      responseData[q.id] = qualities.find(qv => qv.id === q.id)?.score || 0;
    }

    const { error } = await supabase
      .from(config.tableName as any)
      .insert(responseData);

    if (error) {
      if (import.meta.env.DEV) console.error('DB Error:', error.code);
      toast({
        title: "Ошибка",
        description: "Не удалось отправить оценку",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Успешно!",
        description: "Ваша анонимная оценка добавлена",
      });
      handleReset();
      // Realtime-канал может быть выключен на таблице — перечитываем сами,
      // иначе счётчик оценок и среднее команды не обновляются до перезахода
      loadTeamData();
    }
  };

  const hasAnyScore = qualities.some(q => q.score > 0);
  const hasAnyChecked = Object.values(checkedState).some(arr => arr.some(Boolean));
  // Командный результат можно смотреть и без собственных ответов —
  // достаточно ввести ID команды, по которому уже есть оценки
  const hasTeamData = teamId.length > 0 && responseCount > 0 && teamAverage.length > 0;

  if (showResults) {
    const ResultsComponent =
      config.id === 'edtech-risk-radar' ? EdTechRiskResults : BlueOceanResults;
    return (
      <ResultsComponent
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

  // Progress calculation
  const totalBlocks = qualitiesData.length;
  const filledBlocks = qualitiesData.filter(q => 
    checkedState[q.id]?.some(Boolean)
  ).length;
  const completedBlocks = qualitiesData.filter(q =>
    checkedState[q.id]?.every(Boolean)
  ).length;
  const progressPercent = Math.round((filledBlocks / totalBlocks) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-0.5 bg-border/40">
          <div
            className="h-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="px-4 py-6 md:px-8 md:py-10 lg:px-12 pt-4 md:pt-8">
        {/* Header */}
        <header className="mx-auto max-w-5xl mb-8 md:mb-12">
          <div className="animate-fade-up">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              {config.showLogo !== false && (
                <>
                  <BrandLogo size="lg" className="lg:hidden" />
                  <BrandLogo size="xl" className="hidden lg:inline-flex" />
                </>
              )}
              <div className="flex items-center gap-3">
                <InstrumentNav />
                <div className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px] md:text-xs font-medium px-2.5 py-1 rounded-full border border-border bg-card">
                  <span>{totalBlocks} блоков</span>
                  <span className="text-border">·</span>
                  <span>~3 мин</span>
                </div>
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground leading-tight">
              {config.title}
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-lg leading-relaxed">
              {config.subtitle}
            </p>
          </div>
        </header>

        <main className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_2.05fr] gap-4 md:gap-6">
            
            {/* Desktop sidebar */}
            <div className="hidden lg:block lg:sticky lg:top-6 lg:self-start space-y-3">
              <div 
                className="bg-card rounded-xl border border-border card-shadow p-4 h-[20rem] animate-fade-up"
                style={{ animationDelay: '80ms' }}
              >
                <LeaderRadarChart
                  qualities={qualities}
                  title="Ваш радар"
                  teamAverage={teamAverage}
                  showTeamData={teamId.length > 0}
                />
              </div>

              {/* Progress summary */}
              <div 
                className="bg-card rounded-xl border border-border card-shadow p-4 animate-fade-up"
                style={{ animationDelay: '160ms' }}
              >
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
                        <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 text-[9px] font-semibold ${
                          done 
                            ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]' 
                            : checked > 0 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-[11px] truncate flex-1 ${
                          done ? 'text-foreground font-medium' : 'text-muted-foreground'
                        }`}>{q.label}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-10 h-1 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-400"
                              style={{ 
                                width: `${(checked / total) * 100}%`,
                                backgroundColor: done ? 'hsl(var(--success))' : 'hsl(var(--primary))'
                              }}
                            />
                          </div>
                        </div>
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

            {/* Main content */}
            <div className="space-y-3">
              {qualitiesData.map((quality, index) => (
                <div
                  key={quality.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${(index + 1) * 50}ms` }}
                >
                  <QualitySection
                    id={quality.id}
                    label={quality.label}
                    score={qualities.find(q => q.id === quality.id)?.score || 0}
                    criteria={quality.criteria}
                    checkedCriteria={checkedState[quality.id]}
                    onCriteriaChange={handleCriteriaChange}
                    index={index}
                    onFirstOpen={handleFirstBlockOpen}
                  />
                </div>
              ))}

              {/* Mobile radar toggle */}
              <div className="lg:hidden animate-fade-up" style={{ animationDelay: `${(qualitiesData.length + 1) * 50}ms` }}>
                <button
                  onClick={() => setShowMobileRadar(!showMobileRadar)}
                  className="w-full bg-card rounded-xl border border-border card-shadow p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="text-left">
                      <span className="text-sm font-medium text-foreground block">Ваш радар</span>
                      <span className="text-[11px] text-muted-foreground">
                        {hasAnyChecked ? `${filledBlocks}/${totalBlocks} блоков` : 'Нажмите, чтобы посмотреть'}
                      </span>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${showMobileRadar ? 'rotate-180' : ''}`} />
                </button>
                {showMobileRadar && (
                  <div className="bg-card rounded-xl border border-border card-shadow p-4 mt-2 h-64">
                    <LeaderRadarChart
                      qualities={qualities}
                      title="Ваш радар"
                      teamAverage={teamAverage}
                      showTeamData={teamId.length > 0}
                    />
                  </div>
                )}
              </div>

              {/* Mobile team controls */}
              <div className="lg:hidden animate-fade-up" style={{ animationDelay: `${(qualitiesData.length + 1.5) * 50}ms` }}>
                <TeamControls
                  teamId={teamId}
                  teamMemberCount={responseCount}
                  onTeamIdChange={setTeamId}
                />
              </div>

              {/* Result button */}
              <div className="pt-3 pb-2 space-y-2 animate-fade-up" style={{ animationDelay: `${(qualitiesData.length + 2) * 50}ms` }}>
                {teamId && hasAnyChecked && (
                  <Button
                    onClick={handleSubmitResponses}
                    variant="outline"
                    size="lg"
                    className="w-full text-sm py-5 rounded-xl font-medium"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Отправить оценку команде
                  </Button>
                )}
                <Button
                  onClick={() => setShowResults(true)}
                  disabled={!hasAnyChecked && !hasTeamData}
                  size="lg"
                  className="w-full text-sm py-5 rounded-xl font-medium transition-all duration-200 disabled:opacity-30"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Посмотреть результат
                </Button>
              </div>
            </div>
          </div>
        </main>

        {/* Sticky bottom panel */}
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
                  ? 'Результат команды'
                  : filledBlocks < totalBlocks
                    ? `Результат (${filledBlocks}/${totalBlocks})`
                    : 'Результат'}
              </Button>
              <Button
                onClick={handleReset}
                variant={resetConfirm ? "destructive" : "outline"}
                size="lg"
                className="py-4 md:py-5 rounded-xl px-3"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">{resetConfirm ? 'Точно?' : 'Сбросить'}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom spacer */}
        {(hasAnyChecked || hasTeamData) && <div className="h-20" />}
      </div>
    </div>
  );
};

export default AssessmentPage;
