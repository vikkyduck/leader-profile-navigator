import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, KeyRound, RefreshCw, Users } from 'lucide-react';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';
import DualRadarChart from '@/components/DualRadarChart';
import { supabase } from '@/integrations/supabase/client';
import { MOTIVES, ENABLEMENT_TEST, SIGNIFICANCE_TEST } from '@/data/motivation-motives';
import { generateMotivationPdf } from '@/lib/generate-motivation-pdf';

interface TeamSummary {
  team_id: string;
  responses: number;
  significance: number[];
  enablement: number[];
}

const KEY_STORAGE = 'motivation_admin_key';

/** Скачивание CSV с BOM — иначе Excel открывает кириллицу кракозябрами. */
function downloadCsv(filename: string, rows: (string | number)[][]) {
  const body = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');
  const blob = new Blob(['﻿' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const toNumbers = (xs: unknown): number[] =>
  Array.isArray(xs) ? xs.map((v) => Number(v)) : [];

/**
 * Командный экран: средние по команде «как по одному сотруднику» — две линии
 * на паутинке, а не по линии на участника. Данные приходят только через
 * RPC с ключом: напрямую таблица из браузера не читается.
 */
const MotivationTeam = () => {
  const [searchParams] = useSearchParams();
  const keyFromLink = searchParams.get('key');
  const teamFromLink = searchParams.get('team');

  const [secret, setSecret] = useState(
    () => keyFromLink ?? localStorage.getItem(KEY_STORAGE) ?? ''
  );
  const [keyInput, setKeyInput] = useState('');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(teamFromLink);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError(null);
    const { data, error } = await (supabase as any).rpc('motivation_summary', {
      p_secret: secret,
      p_team: null,
    });
    setLoading(false);

    if (error) {
      setError(
        error.code === '42501' || /ключ/i.test(error.message ?? '')
          ? 'Ключ доступа не подошёл'
          : 'Не удалось загрузить данные'
      );
      setTeams([]);
      return;
    }

    const parsed: TeamSummary[] = (data ?? []).map((row: any) => ({
      team_id: row.team_id,
      responses: Number(row.responses),
      significance: toNumbers(row.significance),
      enablement: toNumbers(row.enablement),
    }));
    setTeams(parsed);
    localStorage.setItem(KEY_STORAGE, secret);
    setSelected((prev) => prev ?? parsed[0]?.team_id ?? null);
  }, [secret]);

  useEffect(() => {
    load();
  }, [load]);

  const current = teams.find((t) => t.team_id === selected) ?? teams[0] ?? null;

  const handleAveragesCsv = () => {
    if (!current) return;
    downloadCsv(`motivaciya-srednie-${current.team_id}.csv`, [
      ['Команда', current.team_id],
      ['Анкет в среднем', current.responses],
      [],
      ['Мотив', SIGNIFICANCE_TEST.seriesName, ENABLEMENT_TEST.seriesName, 'Разрыв'],
      ...MOTIVES.map((m, i) => [
        m.full,
        current.significance[i]?.toFixed(2) ?? '',
        current.enablement[i]?.toFixed(2) ?? '',
        (current.significance[i] - current.enablement[i]).toFixed(2),
      ]),
    ]);
  };

  const handleRowsCsv = async () => {
    if (!current) return;
    const { data, error } = await (supabase as any).rpc('motivation_rows', {
      p_secret: secret,
      p_team: current.team_id,
    });
    if (error) {
      toast.error('Не удалось выгрузить анкеты');
      return;
    }
    const header = [
      'Команда',
      'Отправлено',
      ...MOTIVES.map((m) => `Важно: ${m.full}`),
      ...MOTIVES.map((m) => `Даёт: ${m.full}`),
    ];
    const body = (data ?? []).map((r: any) => [
      r.team_id,
      new Date(r.created_at).toLocaleString('ru-RU'),
      ...toNumbers(r.significance),
      ...toNumbers(r.enablement),
    ]);
    downloadCsv(`motivaciya-ankety-${current.team_id}.csv`, [header, ...body]);
  };

  const handlePdf = async () => {
    if (!current) return;
    await generateMotivationPdf({
      title: 'Мотивация: портрет команды',
      subtitle: 'Средние оценки по команде',
      teamCode: current.team_id,
      responses: current.responses,
      seriesALabel: SIGNIFICANCE_TEST.seriesName,
      seriesBLabel: ENABLEMENT_TEST.seriesName,
      rows: MOTIVES.map((m, i) => ({
        label: m.full,
        significance: current.significance[i],
        enablement: current.enablement[i],
      })),
    });
  };

  if (!secret || error === 'Ключ доступа не подошёл') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card rounded-xl border border-border card-shadow p-6 w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">Командные данные</h1>
          </div>
          <div>
            <Label htmlFor="key" className="text-xs text-muted-foreground mb-1.5 block">
              Ключ доступа
            </Label>
            <Input
              id="key"
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setSecret(keyInput.trim())}
              className="bg-background border-border rounded-lg text-sm h-9"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            onClick={() => setSecret(keyInput.trim())}
            className="w-full rounded-lg"
            disabled={!keyInput.trim()}
          >
            Открыть
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <header className="mx-auto max-w-4xl mb-6">
        <div className="flex items-center justify-between mb-6">
          <BrandLogo size="lg" />
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="rounded-lg">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground leading-tight">
          Мотивация: портрет команды
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
          Команда показана как один сотрудник: две линии — средние по всем анкетам, а не по линии
          на человека. Участники этот экран не видят.
        </p>
      </header>

      <main className="mx-auto max-w-4xl space-y-4">
        {teams.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {teams.map((t) => (
              <button
                key={t.team_id}
                onClick={() => setSelected(t.team_id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  current?.team_id === t.team_id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {t.team_id}
                <span className="ml-1.5 opacity-70 tabular-nums">{t.responses}</span>
              </button>
            ))}
          </div>
        )}

        {!current && !loading && (
          <div className="bg-card rounded-xl border border-border card-shadow p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Пока нет ни одной отправленной анкеты.
            </p>
          </div>
        )}

        {current && (
          <>
            <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  Команда «{current.team_id}»
                </span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground mr-2">
                  Анкет в среднем
                </span>
                <span className="text-lg font-semibold text-foreground tabular-nums">
                  {current.responses}
                </span>
              </div>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={handleAveragesCsv} className="rounded-lg">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Средние CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleRowsCsv} className="rounded-lg">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Все анкеты CSV
                </Button>
                <Button size="sm" onClick={handlePdf} className="rounded-lg">
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  PDF
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border card-shadow p-4 h-[26rem] md:h-[32rem]">
              <DualRadarChart
                labels={MOTIVES.map((m) => m.short)}
                seriesA={{ name: SIGNIFICANCE_TEST.seriesName, values: current.significance }}
                seriesB={{ name: ENABLEMENT_TEST.seriesName, values: current.enablement }}
              />
            </div>

            <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Средние по мотивам
              </h3>
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
                    {MOTIVES.map((m, i) => {
                      const gap = current.significance[i] - current.enablement[i];
                      return (
                        <tr key={m.short} className="border-t border-border/40">
                          <td className="py-2 pr-3 text-foreground/80 leading-snug">{m.full}</td>
                          <td className="py-2 text-right tabular-nums text-primary font-medium">
                            {current.significance[i]?.toFixed(1)}
                          </td>
                          <td className="py-2 text-right tabular-nums text-[hsl(var(--chart-2))] font-medium">
                            {current.enablement[i]?.toFixed(1)}
                          </td>
                          <td
                            className={`py-2 text-right tabular-nums font-semibold ${
                              gap > 0 ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            {gap > 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {error && error !== 'Ключ доступа не подошёл' && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </main>
    </div>
  );
};

export default MotivationTeam;
