import { Quality } from '@/types/leader';
import { InstrumentConfig } from '@/types/instrument';
import LeaderRadarChart from '@/components/LeaderRadarChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, AlertTriangle, Battery, Download, BellRing } from 'lucide-react';
import { archetypes, blockToArchetype } from '@/data/resource-radar';
import { generateResourceRadarPdf } from '@/lib/generate-resource-pdf';
import { toast } from 'sonner';

interface ResourceRadarResultsProps {
  qualities: Quality[];
  config: InstrumentConfig;
  checkedState: { [key: string]: boolean[] };
  teamAverage: number[];
  responseCount: number;
  teamId: string;
  onBack: () => void;
}

const ResourceRadarResults = ({
  qualities,
  config,
  checkedState,
  teamAverage,
  responseCount,
  teamId,
  onBack,
}: ResourceRadarResultsProps) => {
  // По блокам: считаем «Да» — это сигналы. Чем больше «Да» — тем сильнее блок влияет на ваш ресурс.
  const blockStats = config.qualities.map((q) => {
    const checked = checkedState[q.id]?.filter(Boolean).length || 0;
    const total = q.criteria.length;
    const pct = total > 0 ? Math.round((checked / total) * 100) : 0;
    return { id: q.id, label: q.label, checked, total, pct };
  });

  // Со-доминирующие архетипы: всё, что в пределах 10% от максимума, максимум 2.
  const sorted = [...blockStats].sort((a, b) => b.pct - a.pct);
  const maxPct = sorted[0]?.pct ?? 0;
  const codominantBlocks = sorted
    .filter((b) => maxPct > 0 && maxPct - b.pct <= 10)
    .slice(0, 2);
  const dominantArchetypes = codominantBlocks
    .map((b) => archetypes[blockToArchetype[b.id]])
    .filter(Boolean);
  const primaryArchetype = dominantArchetypes[0] ?? null;
  const hasDual = dominantArchetypes.length > 1;

  const totalChecked = blockStats.reduce((sum, b) => sum + b.checked, 0);
  const totalCriteria = blockStats.reduce((sum, b) => sum + b.total, 0);
  const overallPct = totalCriteria > 0 ? Math.round((totalChecked / totalCriteria) * 100) : 0;

  const handleDownloadPdf = async () => {
    try {
      toast.loading('Генерация PDF...', { id: 'resource-pdf' });
      const teamBlockStats = config.qualities.map((q, i) => ({
        id: q.id,
        label: q.label,
        pct: Math.round((teamAverage[i] || 0) * 10),
      }));
      await generateResourceRadarPdf({
        archetypes: dominantArchetypes,
        blockStats,
        totalChecked,
        totalCriteria,
        overallPct,
        teamId,
        teamResponseCount: responseCount,
        teamBlockStats: teamId && responseCount > 0 ? teamBlockStats : [],
      });
      toast.success('PDF скачан', { id: 'resource-pdf' });
    } catch {
      toast.error('Не удалось сгенерировать PDF', { id: 'resource-pdf' });
    }
  };

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
            <span className="hidden sm:inline">Вернуться к опросу</span>
            <span className="sm:hidden">Назад</span>
          </Button>
          <Button
            onClick={handleDownloadPdf}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 px-2.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Скачать PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>

        <div>
          <h1 className="text-xl md:text-3xl font-semibold text-foreground">Карта ваших ресурсов</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Результат опроса показывает ваш источник энергии
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        {/* Архетип + Радар */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {primaryArchetype && (
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] card-shadow p-5 md:p-7 space-y-4">
              <div className="flex items-start gap-3">
                <div className="text-primary mt-0.5">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    {hasDual ? 'Ваши архетипы' : 'Ваш архетип'}
                  </p>
                  <h2 className="text-lg md:text-xl font-semibold text-primary mt-0.5">
                    {dominantArchetypes.map((a) => a.name).join(' + ')}
                  </h2>
                  <p className="text-xs md:text-sm text-foreground/70 mt-1">
                    {hasDual
                      ? 'Двойной источник ресурса — оба профиля важны для восстановления'
                      : primaryArchetype.tagline}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
                <div>
                  <p className="text-[11px] text-muted-foreground">Отмечено утверждений</p>
                  <p className="text-xl font-semibold text-foreground tabular-nums">
                    {totalChecked}
                    <span className="text-xs text-muted-foreground font-normal">/{totalCriteria}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Сила сигнала</p>
                  <p className="text-xl font-semibold text-primary tabular-nums">{overallPct}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-card rounded-xl border border-border card-shadow p-4 h-64 md:h-80">
            <LeaderRadarChart
              qualities={qualities}
              title="Карта ресурсов"
              teamAverage={teamAverage}
              showTeamData={teamId.length > 0 && teamAverage.length > 0}
            />
          </div>
        </div>

        {/* Описание архетипа(ов) */}
        {dominantArchetypes.map((archetype, idx) => (
          <div
            key={archetype.name}
            className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5 md:p-7 space-y-4"
          >
            {hasDual && (
              <div className="flex items-center gap-2 pb-3 border-b border-border/40">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-base md:text-lg font-semibold text-primary">
                  {idx + 1}. {archetype.name}
                </h2>
                <span className="text-xs text-muted-foreground">· {archetype.tagline}</span>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Ваша уникальность</h3>
              </div>
              <p className="text-foreground/75 leading-relaxed text-[13px] md:text-sm">
                {archetype.uniqueness}
              </p>
            </div>

            <div className="pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Почему вы «гаснете»</h3>
              </div>
              <p className="text-foreground/75 leading-relaxed text-[13px] md:text-sm">
                {archetype.whyDrains}
              </p>
            </div>

            <div className="pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-3">
                <Battery className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Экологичное восстановление</h3>
              </div>
              <div className="space-y-3">
                {archetype.recovery.map((r, i) => (
                  <div key={i} className="bg-card/60 rounded-lg p-3 border border-border/50">
                    <p className="text-[13px] font-medium text-foreground mb-1">{r.title}</p>
                    <p className="text-xs md:text-[13px] text-foreground/70 leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-2">
                <BellRing className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">
                  Карта сигналов: пора восстановиться
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">
                Специфические маркеры раннего оповещения · {archetype.earlyWarnings.level}
              </p>
              <ul className="space-y-2">
                {archetype.earlyWarnings.signals.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-[13px] md:text-sm text-foreground/75 leading-relaxed"
                  >
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* По блокам */}
        <div className="bg-card rounded-xl border border-border card-shadow p-5 md:p-7">
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">Источники энергии по блокам</h2>
          <p className="text-xs text-muted-foreground mb-4">
            Чем выше процент — тем сильнее этот блок влияет на ваш ресурс
          </p>
          <div className="space-y-3">
            {blockStats.map((block) => (
              <div key={block.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] font-medium text-foreground">{block.label}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {block.checked}/{block.total} · {block.pct}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${block.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Командный портрет */}
        {teamId && responseCount > 0 && (
          <div className="bg-card rounded-xl border border-border card-shadow p-5 md:p-7">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">
              Командный портрет
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Усреднённая карта ресурсов команды «{teamId}» · {responseCount}{' '}
              {responseCount === 1 ? 'участник' : 'участников'}
            </p>
            <div className="space-y-3">
              {config.qualities.map((q, i) => {
                const avg = teamAverage[i] || 0;
                // score нормализован 0-10, переводим обратно в %
                const pct = Math.round(avg * 10);
                return (
                  <div key={q.id} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[13px] font-medium text-foreground">{q.label}</span>
                      <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground/60 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ResourceRadarResults;
