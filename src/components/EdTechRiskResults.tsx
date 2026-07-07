import { Quality } from '@/types/leader';
import { InstrumentConfig } from '@/types/instrument';
import LeaderRadarChart from '@/components/LeaderRadarChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Anchor, Compass, AlertTriangle, ShieldAlert, Check, X, Download } from 'lucide-react';
import { generateEdTechRiskPdf } from '@/lib/generate-edtech-risk-pdf';
import { toast } from 'sonner';

interface EdTechRiskResultsProps {
  qualities: Quality[];
  config: InstrumentConfig;
  checkedState: { [key: string]: boolean[] };
  teamAverage: number[];
  responseCount: number;
  teamId: string;
  onBack: () => void;
}

interface ResilienceLevel {
  min: number;
  title: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
}

const LEVELS: ResilienceLevel[] = [
  {
    min: 9,
    title: 'Антихрупкий бизнес',
    tagline: '9–10 из 10 · Устойчивость в неопределённости',
    icon: <Shield className="w-6 h-6" />,
    color: 'text-primary',
    borderColor: 'border-primary/20',
    bgColor: 'bg-primary/[0.03]',
    description: `Вы построили бизнес, который не просто выдерживает удары, а становится сильнее от них. У вас есть портфель гипотез, дешёвая цена ошибки, свободный ресурс и алгоритм действий на случай кризиса конкурентов. Когда рынок штормит — вы забираете долю, а не удерживаете позиции.\n\nЭто редкая конфигурация. Главная задача сейчас — не потерять её из-за успокоенности: продолжайте искать ранние сигналы и держать в работе несколько небольших ставок вместо одной большой.`,
  },
  {
    min: 7,
    title: 'Устойчивая система',
    tagline: '7–8 из 10 · Крепкая опора с уязвимостями',
    icon: <Anchor className="w-6 h-6" />,
    color: 'text-primary',
    borderColor: 'border-primary/20',
    bgColor: 'bg-primary/[0.03]',
    description: `У вас крепкий фундамент: большинство опор устойчивости работают. Вы переживёте локальные шоки — падение канала трафика, уход эксперта, изменение регуляторики — без критических потерь.\n\nНо есть 2–3 уязвимости, которые в затяжной турбулентности могут стать критичными. Посмотрите на список пропущенных утверждений ниже: это ваш чек-лист приоритетов на ближайшие месяцы. Ставку делайте на те, что связаны с ранним обнаружением проблем и свободным ресурсом.`,
  },
  {
    min: 5,
    title: 'Средняя устойчивость',
    tagline: '5–6 из 10 · Держитесь, пока рынок спокоен',
    icon: <Compass className="w-6 h-6" />,
    color: 'text-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/30',
    description: `Половина опор устойчивости у вас есть, половины — нет. В стабильные периоды это не заметно: бизнес работает, деньги идут. Но при резком внешнем изменении — новой технологии, регуляторной волне, уходе крупного канала — у вас нет заранее подготовленных ответов.\n\nСамый быстрый способ поднять устойчивость: не пытайтесь закрыть всё сразу. Возьмите 1–2 пропущенных утверждения из списка ниже, связанных с картой внешних рисков и свободным ресурсом. Они дают наибольший прирост устойчивости при минимальных вложениях.`,
  },
  {
    min: 3,
    title: 'Хрупкая конструкция',
    tagline: '3–4 из 10 · Зависимость от внешних условий',
    icon: <AlertTriangle className="w-6 h-6" />,
    color: 'text-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/30',
    description: `Бизнес живёт в режиме «пока не штормит». Большинство сценариев кризиса — падение спроса, действия конкурента, изменение правил игры — застанут вас врасплох. Отсутствие свободного ресурса и портфеля гипотез означает, что каждое решение — ставка «ва-банк».\n\nПо Талебу — это ровно та конструкция, которую первый же серьёзный стресс покажет с трещинами. Начните с самого фундаментального: перестаньте держать все ресурсы в одной большой ставке. Один-два дешёвых теста в параллель уже кардинально меняют картину.`,
  },
  {
    min: 0,
    title: 'Красная зона хрупкости',
    tagline: '0–2 из 10 · Критическая зависимость от одного сценария',
    icon: <ShieldAlert className="w-6 h-6" />,
    color: 'text-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/20',
    description: `Бизнес построен на предположении, что завтра будет как вчера. Нет свободного ресурса на эксперименты, нет карты внешних рисков, нет ранних сигналов. Всё держится на одной большой ставке — и это работает ровно до момента, пока рынок ведёт себя предсказуемо.\n\nЭто не приговор — большинство бизнесов начинают отсюда. Но откладывать нельзя: 2026 год почти гарантированно принесёт как минимум одно событие, к которому в такой конфигурации не подготовиться. Начните с малого — с одного дешёвого теста параллельно основной деятельности и списка внешних факторов, которые могут убить спрос.`,
  },
];

function getLevel(checked: number): ResilienceLevel {
  return LEVELS.find((l) => checked >= l.min) || LEVELS[LEVELS.length - 1];
}

const EdTechRiskResults = ({
  qualities,
  config,
  checkedState,
  teamAverage,
  responseCount,
  teamId,
  onBack,
}: EdTechRiskResultsProps) => {
  // Каждое качество = одно утверждение. Отмечено = 1, не отмечено = 0.
  const items = config.qualities.map((q) => {
    const isChecked = (checkedState[q.id] || []).some(Boolean);
    return {
      id: q.id,
      label: q.label,
      description: q.criteria[0]?.description || q.description,
      short: q.description,
      isChecked,
    };
  });

  const checkedCount = items.filter((i) => i.isChecked).length;
  const total = items.length;
  const level = getLevel(checkedCount);

  const supports = items.filter((i) => i.isChecked);
  const gaps = items.filter((i) => !i.isChecked);

  const handleDownloadPdf = async () => {
    try {
      toast.loading('Генерация PDF...', { id: 'edtech-pdf' });
      const teamStats = config.qualities.map((q, i) => ({
        label: q.label,
        pct: Math.round((teamAverage[i] || 0) * 10),
      }));
      await generateEdTechRiskPdf({
        levelTitle: level.title,
        levelTagline: level.tagline,
        levelDescription: level.description,
        checkedCount,
        total,
        items,
        teamId,
        teamResponseCount: responseCount,
        teamStats: teamId && responseCount > 0 ? teamStats : [],
      });
      toast.success('PDF скачан', { id: 'edtech-pdf' });
    } catch {
      toast.error('Не удалось сгенерировать PDF', { id: 'edtech-pdf' });
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
          <h1 className="text-xl md:text-3xl font-semibold text-foreground">
            Ваш потенциал устойчивости
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Насколько ваш EdTech-бизнес готов к неопределённому времени
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        {/* Уровень + радар */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <div
            className={`rounded-xl border ${level.borderColor} ${level.bgColor} card-shadow p-5 md:p-7 space-y-4`}
          >
            <div className="flex items-start gap-3">
              <div className={`${level.color} mt-0.5`}>{level.icon}</div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {level.tagline}
                </p>
                <h2 className={`text-lg md:text-xl font-semibold ${level.color} mt-0.5`}>
                  {level.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
              <div>
                <p className="text-[11px] text-muted-foreground">Опоры устойчивости</p>
                <p className="text-xl font-semibold text-foreground tabular-nums">
                  {checkedCount}
                  <span className="text-xs text-muted-foreground font-normal">/{total}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Зоны уязвимости</p>
                <p className="text-xl font-semibold text-foreground tabular-nums">
                  {gaps.length}
                  <span className="text-xs text-muted-foreground font-normal">/{total}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border card-shadow p-4 h-64 md:h-80">
            <LeaderRadarChart
              qualities={qualities}
              title="Профиль устойчивости"
              teamAverage={teamAverage}
              showTeamData={teamId.length > 0 && teamAverage.length > 0}
            />
          </div>
        </div>

        {/* Описание уровня */}
        <div className={`rounded-xl border ${level.borderColor} ${level.bgColor} p-5 md:p-7`}>
          {level.description.split('\n\n').map((p, i) => (
            <p
              key={i}
              className="text-foreground/75 leading-relaxed text-[13px] md:text-sm mb-3 last:mb-0"
            >
              {p}
            </p>
          ))}
        </div>

        {/* Опоры устойчивости */}
        {supports.length > 0 && (
          <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5 md:p-7">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-primary" />
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                Ваши опоры устойчивости
              </h2>
              <span className="text-xs text-muted-foreground">· {supports.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              На эти практики можно опереться, когда внешние условия перестанут быть предсказуемыми
            </p>
            <div className="space-y-3">
              {supports.map((s) => (
                <div
                  key={s.id}
                  className="bg-card/60 rounded-lg p-3 md:p-4 border border-border/50"
                >
                  <p className="text-[13px] md:text-sm font-medium text-foreground mb-1">
                    {s.label}
                  </p>
                  <p className="text-xs md:text-[13px] text-foreground/70 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Зоны уязвимости */}
        {gaps.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/20 p-5 md:p-7">
            <div className="flex items-center gap-2 mb-1">
              <X className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-base md:text-lg font-semibold text-foreground">
                Зоны уязвимости
              </h2>
              <span className="text-xs text-muted-foreground">· {gaps.length}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Пропущенные утверждения — это места, где стресс покажет трещину раньше всего. Не обязательно закрывать все: даже 1–2 из этого списка заметно поднимают устойчивость.
            </p>
            <div className="space-y-3">
              {gaps.map((g) => (
                <div
                  key={g.id}
                  className="bg-card/60 rounded-lg p-3 md:p-4 border border-border/50"
                >
                  <p className="text-[13px] md:text-sm font-medium text-foreground mb-1">
                    {g.label}
                  </p>
                  <p className="text-xs md:text-[13px] text-foreground/70 leading-relaxed">
                    {g.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Командный портрет */}
        {teamId && responseCount > 0 && (
          <div className="bg-card rounded-xl border border-border card-shadow p-5 md:p-7">
            <h2 className="text-base md:text-lg font-semibold text-foreground mb-1">
              Командный портрет устойчивости
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Средняя доля команд «{teamId}», где отмечено это утверждение · {responseCount}{' '}
              {responseCount === 1 ? 'участник' : 'участников'}
            </p>
            <div className="space-y-3">
              {config.qualities.map((q, i) => {
                const avg = teamAverage[i] || 0;
                // score нормализован 0-10, где 10 = отмечено. Переводим в %.
                const pct = Math.round(avg * 10);
                return (
                  <div key={q.id} className="space-y-1.5">
                    <div className="flex justify-between items-center gap-3">
                      <span className="text-[13px] font-medium text-foreground truncate">
                        {q.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground tabular-nums flex-shrink-0">
                        {pct}%
                      </span>
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

export default EdTechRiskResults;
