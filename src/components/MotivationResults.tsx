import { useState } from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';
import DualRadarChart from '@/components/DualRadarChart';
import { MOTIVES, ENABLEMENT_TEST, SIGNIFICANCE_TEST } from '@/data/motivation-motives';
import { generateMotivationPdf } from '@/lib/generate-motivation-pdf';

interface MotivationResultsProps {
  significance: number[];
  enablement: number[];
  onBack: () => void;
}

/**
 * Личный результат участника. Командных данных здесь нет и быть не должно:
 * средние по команде видит только администратор на /motivation/team.
 */
const MotivationResults = ({ significance, enablement, onBack }: MotivationResultsProps) => {
  const [saving, setSaving] = useState(false);

  const rows = MOTIVES.map((m, i) => ({
    ...m,
    significance: significance[i],
    enablement: enablement[i],
    gap: significance[i] - enablement[i],
  }));

  // Дефицит — важно, но компания не даёт. Запас — даёт больше, чем нужно.
  const deficits = [...rows].filter((r) => r.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3);
  const surplus = [...rows].filter((r) => r.gap < 0).sort((a, b) => a.gap - b.gap).slice(0, 3);

  const avg = (xs: number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
  const avgSignificance = avg(significance);
  const avgEnablement = avg(enablement);

  const handlePdf = async () => {
    setSaving(true);
    try {
      await generateMotivationPdf({
        title: 'Мотивация профессиональной деятельности',
        subtitle: 'Личный результат',
        rows: rows.map((r) => ({
          label: r.full,
          significance: r.significance,
          enablement: r.enablement,
        })),
        seriesALabel: SIGNIFICANCE_TEST.seriesName,
        seriesBLabel: ENABLEMENT_TEST.seriesName,
      });
    } catch {
      toast.error('Не удалось собрать PDF');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <header className="mx-auto max-w-4xl mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-6">
          <BrandLogo size="lg" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onBack} className="rounded-lg">
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Назад
            </Button>
            <Button size="sm" onClick={handlePdf} disabled={saving} className="rounded-lg">
              <Download className="w-4 h-4 mr-1.5" />
              {saving ? 'Готовим…' : 'Скачать PDF'}
            </Button>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
          Ваш профиль мотивации
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
          Сплошная линия — насколько мотив важен лично вам. Пунктир — насколько компания даёт его
          реализовать. Расхождение между ними и есть предмет разговора.
        </p>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        <div className="bg-card rounded-xl border border-border card-shadow p-4 h-[26rem] md:h-[32rem]">
          <DualRadarChart
            labels={MOTIVES.map((m) => m.short)}
            seriesA={{ name: SIGNIFICANCE_TEST.seriesName, values: significance }}
            seriesB={{ name: ENABLEMENT_TEST.seriesName, values: enablement }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5">
            <p className="text-[11px] text-muted-foreground">Средняя значимость</p>
            <p className="text-xl md:text-2xl font-semibold text-primary tabular-nums mt-0.5">
              {avgSignificance.toFixed(1)}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5">
            <p className="text-[11px] text-muted-foreground">Средняя реализация в компании</p>
            <p className="text-xl md:text-2xl font-semibold text-[hsl(var(--chart-2))] tabular-nums mt-0.5">
              {avgEnablement.toFixed(1)}
            </p>
          </div>
        </div>

        {(deficits.length > 0 || surplus.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {deficits.length > 0 && (
              <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Важно, но не хватает
                </h3>
                <div className="space-y-2">
                  {deficits.map((r) => (
                    <div key={r.short} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-muted-foreground leading-snug">{r.full}</span>
                      <span className="text-xs font-semibold text-primary tabular-nums whitespace-nowrap">
                        −{r.gap}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {surplus.length > 0 && (
              <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Компания даёт с запасом
                </h3>
                <div className="space-y-2">
                  {surplus.map((r) => (
                    <div key={r.short} className="flex items-start justify-between gap-3">
                      <span className="text-xs text-muted-foreground leading-snug">{r.full}</span>
                      <span className="text-xs font-semibold text-[hsl(var(--chart-2))] tabular-nums whitespace-nowrap">
                        +{Math.abs(r.gap)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Все мотивы</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground text-left">
                  <th className="font-medium pb-2">Мотив</th>
                  <th className="font-medium pb-2 text-right whitespace-nowrap">Важно</th>
                  <th className="font-medium pb-2 text-right whitespace-nowrap">Даёт</th>
                  <th className="font-medium pb-2 text-right whitespace-nowrap">Разрыв</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.short} className="border-t border-border/40">
                    <td className="py-2 pr-3 text-foreground/80 leading-snug">{r.full}</td>
                    <td className="py-2 text-right tabular-nums text-primary font-medium">
                      {r.significance}
                    </td>
                    <td className="py-2 text-right tabular-nums text-[hsl(var(--chart-2))] font-medium">
                      {r.enablement}
                    </td>
                    <td
                      className={`py-2 text-right tabular-nums font-semibold ${
                        r.gap > 0 ? 'text-primary' : r.gap < 0 ? 'text-muted-foreground' : 'text-muted-foreground/50'
                      }`}
                    >
                      {r.gap > 0 ? `+${r.gap}` : r.gap}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed pb-8">
          Ответы анонимны и используются только в совокупности с ответами других участников.
        </p>
      </main>
    </div>
  );
};

export default MotivationResults;
