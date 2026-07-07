import { Quality } from '@/types/leader';
import { InstrumentConfig } from '@/types/instrument';
import LeaderRadarChart from '@/components/LeaderRadarChart';
import { analyzeImbalances, detectProfile, getNextStep, Imbalance } from '@/data/indicator-interpretations';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, Zap, TrendingUp, Users } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

interface ResultsInterpretationProps {
  qualities: Quality[];
  config: InstrumentConfig;
  teamAverage: number[];
  responseCount: number;
  teamId: string;
  onBack: () => void;
}

const ResultsInterpretation = ({
  qualities,
  config,
  teamAverage,
  responseCount,
  teamId,
  onBack,
}: ResultsInterpretationProps) => {
  const scores: Record<string, number> = {};
  for (const q of qualities) {
    scores[q.id] = q.score;
  }

  const profile = detectProfile(scores);
  const imbalances = analyzeImbalances(scores);
  const nextStep = getNextStep(scores);

  const totalScore = qualities.reduce((sum, q) => sum + q.score, 0);
  const avgScore = Math.round((totalScore / qualities.length) * 10) / 10;

  const risks = imbalances.filter(i => i.type === 'risk');
  const synergies = imbalances.filter(i => i.type === 'synergy');

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <header className="mx-auto max-w-4xl mb-8 md:mb-10">
        <div className="flex items-center justify-between mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="-ml-2 text-muted-foreground hover:text-foreground text-xs"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Вернуться к опросу
          </Button>
          <BrandLogo size="md" />
        </div>

        <h1 className="text-xl md:text-3xl font-semibold text-foreground">
          Ваш профиль
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Интерпретация результатов «{config.title}»
        </p>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        {/* Profile Card + Radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div className="bg-card rounded-xl border border-border card-shadow p-5 md:p-7 space-y-4">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ваш профиль</p>
              <h2 className="text-lg md:text-xl font-semibold text-foreground mt-1">{profile.title}</h2>
            </div>

            <p className="text-foreground/75 leading-relaxed text-[13px] md:text-sm">
              {profile.description}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
              <div>
                <p className="text-[11px] text-muted-foreground">Средний балл</p>
                <p className="text-xl font-semibold text-primary tabular-nums">{avgScore}<span className="text-xs text-muted-foreground font-normal">/10</span></p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Заполнено осей</p>
                <p className="text-xl font-semibold text-foreground tabular-nums">
                  {qualities.filter(q => q.score > 0).length}<span className="text-xs text-muted-foreground font-normal">/5</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border card-shadow p-4 h-64 md:h-80">
            <LeaderRadarChart
              qualities={qualities}
              title="Мой профиль"
              teamAverage={teamAverage}
              showTeamData={teamId.length > 0 && teamAverage.length > 0}
            />
          </div>
        </div>

        {/* Team Portrait */}
        {teamId && responseCount > 0 && teamAverage.length > 0 && (
          <div className="bg-card rounded-xl border border-border card-shadow p-5 md:p-7 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">Портрет команды</h2>
              <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-md ml-auto tabular-nums">
                {responseCount} {responseCount === 1 ? 'оценка' : responseCount < 5 ? 'оценки' : 'оценок'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {config.qualities.map((q, i) => {
                const teamScore = teamAverage[i] ? Math.round(teamAverage[i] * 10) / 10 : 0;
                const myScore = qualities.find(qv => qv.id === q.id)?.score || 0;
                const diff = myScore - teamScore;
                return (
                  <div key={q.id} className="bg-muted/30 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-medium mb-1.5 truncate">{q.label}</p>
                    <p className="text-lg font-semibold text-foreground tabular-nums">{teamScore}</p>
                    {diff !== 0 && (
                      <p className={`text-[10px] mt-0.5 tabular-nums ${diff > 0 ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                        {diff > 0 ? '+' : ''}{Math.round(diff * 10) / 10}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Step */}
        <div className="bg-primary/[0.03] border border-primary/15 rounded-xl p-5 md:p-7 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Следующий шаг</h2>
          </div>
          <p className="text-foreground/75 leading-relaxed text-[13px] md:text-sm">
            {nextStep}
          </p>
        </div>

        {/* Imbalances */}
        {(risks.length > 0 || synergies.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Связки между осями</h2>

            {risks.length > 0 && (
              <div className="space-y-2">
                {risks.map((imb, i) => (
                  <ImbalanceCard key={`risk-${i}`} imbalance={imb} />
                ))}
              </div>
            )}

            {synergies.length > 0 && (
              <div className="space-y-2">
                {synergies.map((imb, i) => (
                  <ImbalanceCard key={`syn-${i}`} imbalance={imb} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Score Breakdown */}
        <div className="bg-card rounded-xl border border-border card-shadow p-5 md:p-7">
          <h2 className="text-base font-semibold text-foreground mb-4">Детальный профиль</h2>
          <div className="space-y-3">
            {config.qualities.map(q => {
              const score = qualities.find(qv => qv.id === q.id)?.score || 0;
              return (
                <div key={q.id} className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">{q.label}</span>
                    <span className="text-xs font-semibold text-primary tabular-nums">{score}/10</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${score * 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{q.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

function ImbalanceCard({ imbalance }: { imbalance: Imbalance }) {
  const isRisk = imbalance.type === 'risk';

  return (
    <div className={`rounded-xl border p-4 md:p-5 space-y-1.5 ${
      isRisk
        ? 'bg-destructive/[0.03] border-destructive/15'
        : 'bg-[hsl(var(--success)/0.03)] border-[hsl(var(--success)/0.15)]'
    }`}>
      <div className="flex items-center gap-2">
        {isRisk ? (
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
        ) : (
          <Zap className="w-4 h-4 text-[hsl(var(--success))] flex-shrink-0" />
        )}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-medium text-foreground">{imbalance.pair.axis1Label}</span>
          <span className="text-muted-foreground text-xs">×</span>
          <span className="text-sm font-medium text-foreground">{imbalance.pair.axis2Label}</span>
          {isRisk && (
            <span className="text-[10px] bg-destructive/8 text-destructive px-1.5 py-0.5 rounded">
              разрыв {imbalance.gap}
            </span>
          )}
        </div>
      </div>
      <p className="text-foreground/70 text-xs leading-relaxed pl-6">
        {isRisk ? imbalance.pair.risk : imbalance.pair.synergy}
      </p>
    </div>
  );
}

export default ResultsInterpretation;
