import { Quality } from '@/types/leader';
import { InstrumentConfig } from '@/types/instrument';
import LeaderRadarChart from '@/components/LeaderRadarChart';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Anchor, Rocket, Compass, Swords, AlertCircle, Share2, Copy, Check, Download } from 'lucide-react';
import { generateResultsPdf } from '@/lib/generate-pdf';
import { useState } from 'react';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';

interface BlueOceanResultsProps {
  qualities: Quality[];
  config: InstrumentConfig;
  checkedState: { [key: string]: boolean[] };
  teamAverage: number[];
  responseCount: number;
  teamId: string;
  onBack: () => void;
}

interface ResultLevel {
  range: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  description: string;
}

const RESULT_LEVELS: ResultLevel[] = [
  {
    range: '80–100%',
    title: '«Свободное плавание»',
    icon: <Anchor className="w-6 h-6" />,
    color: 'text-primary',
    borderColor: 'border-primary/20',
    bgColor: 'bg-primary/[0.03]',
    description: `Вы нашли способ расти без оглядки на конкурентов. Ваши клиенты приходят не потому, что вы дешевле или «лучше по фичам», а потому что вы решаете задачу, которую больше никто не решает. У вас здоровая маржа, предсказуемый поток клиентов и понятная экономика масштабирования.\n\nЧто это значит на практике: вам не нужно мониторить каждый шаг конкурентов. Вы сами задаёте правила в своей нише. Сарафан работает, потому что людям есть что рассказать: «Там все по-другому».\n\nГлавный риск на этом уровне: самоуспокоенность. Рынок меняется, и то, что сегодня уникально, через 2 года может стать новым стандартом. Продолжайте задавать себе вопрос: «Кто ещё НЕ покупает у нас — и почему?»`,
  },
  {
    range: '60–79%',
    title: '«Один шаг до прорыва»',
    icon: <Rocket className="w-6 h-6" />,
    color: 'text-[hsl(var(--chart-2))]',
    borderColor: 'border-[hsl(var(--chart-2)/0.2)]',
    bgColor: 'bg-[hsl(var(--chart-2)/0.03)]',
    description: `У вас сильный фундамент. В части блоков вы уже работаете не так, как все, — и это приносит результат. Но в других зонах бизнес всё ещё живёт по общим правилам отрасли: конкурирует по цене, вкладывается в то же, во что вкладываются остальные, борётся за тех же клиентов.\n\nЧто это значит на практике: вы чувствуете, что «что-то работает, но не до конца». Часть клиентов приходит легко — по рекомендации, без долгих переговоров. А другая часть — через дорогую рекламу, скидки и уговоры. Это два разных бизнеса внутри одного.\n\nЧто делать: посмотрите на блоки, где у вас меньше всего «Да». Именно там спрятан рычаг. Часто достаточно одного сильного решения — отказаться от лишнего, упростить вход, сдвинуть фокус — чтобы «прорыв» стал системным.`,
  },
  {
    range: '40–59%',
    title: '«На перекрёстке»',
    icon: <Compass className="w-6 h-6" />,
    color: 'text-muted-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/30',
    description: `Вы не застряли — вы на развилке. Отдельные решения уже выделяют вас: возможно, у вас сильный продукт, или лояльные клиенты, или нестандартная экономика. Но в целом бизнес работает в общей логике отрасли. Вы сравниваете себя с конкурентами, реагируете на их ходы и тратите ресурсы на то, чтобы «не отставать».\n\nЧто это значит на практике: рост есть, но он требует всё больше усилий. Каждый следующий клиент обходится дороже предыдущего. Маржа не растёт пропорционально выручке. Команда чувствует, что «крутится, но не разгоняется».\n\nЧто делать: самый частый источник прорыва на этом уровне — найти людей, которые сейчас НЕ покупают у вас (и ни у кого в вашей нише), и понять, что им мешает. Эти люди — ваш главный ресурс роста. Второе — честно посмотреть на свои расходы и спросить: «Что из этого мы делаем, потому что ТАК ПРИНЯТО, а не потому что это нужно клиенту?»`,
  },
  {
    range: '20–39%',
    title: '«Гонка вооружений»',
    icon: <Swords className="w-6 h-6" />,
    color: 'text-muted-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/20',
    description: `Вы конкурируете. Каждый день. За каждого клиента. Ваши конкуренты делают примерно то же самое, что и вы, — и клиент выбирает по цене, по привычке или по случайному фактору. Если кто-то из конкурентов завтра снизит цену на 15% — вам придётся реагировать.\n\nЧто это значит на практике: вы много работаете, но ощущение «бега на месте» не уходит. Реклама дорожает. Клиенты торгуются. Сотрудники выгорают. Вы знаете всех конкурентов по именам и следите за каждым их шагом. При этом они следят за вами.\n\nЧто делать: остановиться и задать себе три вопроса. Первый: «Кто те люди, которым мой продукт реально был бы нужен, но которые сейчас даже не знают о моём существовании?» Второй: «Что из того, что я делаю каждый день, на самом деле не нужно клиенту — я делаю это, потому что так делают все?» Третий: «Если бы я строил этот бизнес с нуля сегодня — стал бы я делать то же самое?» Честные ответы на эти вопросы — начало другой стратегии.`,
  },
  {
    range: '0–19%',
    title: '«Красная зона»',
    icon: <AlertCircle className="w-6 h-6" />,
    color: 'text-muted-foreground',
    borderColor: 'border-border',
    bgColor: 'bg-muted/10',
    description: `Бизнес полностью зависит от внешних условий: от состояния рынка, от действий конкурентов, от цен на рекламу. Вы продаете примерно то же, что и все, — примерно тем же людям, примерно по тем же каналам. Каждый год становится тяжелее: клиент считает, что «все одинаковые», и выбирает дешевле.\n\nЧто это значит на практике: у вас нет одного предложения, которое описывает, ПОЧЕМУ клиент должен выбрать именно вас. Или оно есть, но звучит так же, как у соседа. Большая часть дохода уходит на поддержание текущих процессов, а не на рост. Масштабирование означает пропорциональный рост затрат.\n\nЧто делать: не паниковать. Эта ситуация — не приговор, а отправная точка. Большинство бизнесов начинают именно отсюда. Ваша задача — не «стать лучше конкурентов», а перестать конкурировать на их поле. Найдите задачу, которую люди решают «костылями» (форумами, знакомыми, Excel-табличками), и предложите им простое решение. Уберите из бизнеса все, что вы делаете «потому что так принято», а не потому что это ценит клиент. Начните с одного изменения — но радикального.`,
  },
];

const BLOCK_QUESTIONS: Record<string, string> = {
  market: 'Кто те люди, которым ваш продукт был бы нужен, но которые сейчас даже не знают о вашем существовании?',
  client: 'Какую задачу ваши потенциальные клиенты сейчас решают «костылями» — форумами, знакомыми, Excel-табличками?',
  product: 'Какой этап в вашем продукте клиенты чаще всего «перепрыгивают» или на котором зависают?',
  economics: 'Что из того, что вы делаете каждый день, на самом деле не нужно клиенту — вы делаете это, потому что так делают все?',
  uniqueness: 'Если убрать название с вашего сайта — поймёт ли клиент, что это вы?',
  sustainability: 'Если крупный конкурент скопирует ваш подход завтра — сколько времени ему понадобится, чтобы выйти на ваш уровень?',
};

function getResultLevel(percentage: number): ResultLevel {
  if (percentage >= 80) return RESULT_LEVELS[0];
  if (percentage >= 60) return RESULT_LEVELS[1];
  if (percentage >= 40) return RESULT_LEVELS[2];
  if (percentage >= 20) return RESULT_LEVELS[3];
  return RESULT_LEVELS[4];
}

const BlueOceanResults = ({
  qualities,
  config,
  checkedState,
  teamAverage,
  responseCount,
  teamId,
  onBack,
}: BlueOceanResultsProps) => {
  const [copied, setCopied] = useState(false);

  const totalCriteria = config.qualities.reduce((sum, q) => sum + q.criteria.length, 0);
  const totalChecked = Object.values(checkedState).reduce(
    (sum, arr) => sum + arr.filter(Boolean).length,
    0
  );
  const percentage = Math.round((totalChecked / totalCriteria) * 100);
  const result = getResultLevel(percentage);

  // Командный результат: среднее по шкалам 0–10 → процент, зона — той же шкалой
  const hasTeamData = teamId.length > 0 && responseCount > 0 && teamAverage.length > 0;
  const teamPercentage = hasTeamData
    ? Math.round((teamAverage.reduce((s, v) => s + v, 0) / teamAverage.length) * 10)
    : 0;
  const teamResult = getResultLevel(teamPercentage);
  const ownEmpty = totalChecked === 0;
  // Что описываем ниже по странице: команду, если своих ответов нет
  const shownResult = ownEmpty && hasTeamData ? teamResult : result;

  const blockStats = config.qualities.map((q) => {
    const checked = checkedState[q.id]?.filter(Boolean).length || 0;
    const total = q.criteria.length;
    const pct = Math.round((checked / total) * 100);
    return { id: q.id, label: q.label, checked, total, pct };
  });

  const weakestBlocks = [...blockStats].sort((a, b) => a.pct - b.pct).filter(b => b.pct < 60);
  const weakestBlock = weakestBlocks.length > 0 ? weakestBlocks[0] : null;

  const handleShare = async () => {
    const shareText = `Моя диагностика «Голубой океан»: ${percentage}% — ${result.title}. Пройди тоже:`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Диагностика вашего продукта на устойчивость', text: shareText, url: shareUrl });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      toast.success('Ссылка скопирована');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      toast.loading('Генерация PDF...', { id: 'pdf' });
      await generateResultsPdf({
        percentage,
        resultTitle: result.title,
        resultRange: result.range,
        resultDescription: result.description,
        totalChecked,
        totalCriteria,
        blockStats,
        weakestBlock,
        weakestBlockQuestion: weakestBlock
          ? (BLOCK_QUESTIONS[weakestBlock.id] || 'Что вы можете изменить в этом блоке уже на следующей неделе?')
          : '',
      });
      toast.success('PDF скачан', { id: 'pdf' });
    } catch {
      toast.error('Не удалось сгенерировать PDF', { id: 'pdf' });
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
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
          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPdf}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 px-2.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 px-2.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Скопировано' : 'Поделиться'}</span>
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-semibold text-foreground">Ваш результат</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Диагностика: насколько вы свободны от конкурентной борьбы
            </p>
          </div>
          {config.id !== 'indicator-radar' && <BrandLogo size="lg" className="hidden sm:inline-flex" />}
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 md:space-y-6">
        {/* Result card + Radar. Если своих ответов нет, а команда есть —
            основной карточкой становится командный результат */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {ownEmpty && hasTeamData ? (
            <div className={`rounded-xl border ${teamResult.borderColor} ${teamResult.bgColor} card-shadow p-5 md:p-7 space-y-4`}>
              <div className="flex items-start gap-3">
                <div className={`${teamResult.color} mt-0.5`}>{teamResult.icon}</div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Команда «{teamId}» · {teamResult.range} «Да»
                  </p>
                  <h2 className={`text-lg md:text-xl font-semibold ${teamResult.color} mt-0.5`}>
                    {teamResult.title}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
                <div>
                  <p className="text-[11px] text-muted-foreground">Оценок в команде</p>
                  <p className="text-xl font-semibold text-foreground tabular-nums">{responseCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Средний процент</p>
                  <p className={`text-xl font-semibold ${teamResult.color} tabular-nums`}>
                    {teamPercentage}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
          <div className={`rounded-xl border ${result.borderColor} ${result.bgColor} card-shadow p-5 md:p-7 space-y-4`}>
            <div className="flex items-start gap-3">
              <div className={`${result.color} mt-0.5`}>{result.icon}</div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {result.range} «Да»
                </p>
                <h2 className={`text-lg md:text-xl font-semibold ${result.color} mt-0.5`}>
                  {result.title}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
              <div>
                <p className="text-[11px] text-muted-foreground">Отмечено</p>
                <p className="text-xl font-semibold text-foreground tabular-nums">
                  {totalChecked}<span className="text-xs text-muted-foreground font-normal">/{totalCriteria}</span>
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Процент</p>
                <p className={`text-xl font-semibold ${result.color} tabular-nums`}>
                  {percentage}%
                </p>
              </div>
            </div>
          </div>
          )}

          <div className="bg-card rounded-xl border border-border card-shadow p-4 h-64 md:h-80">
            <LeaderRadarChart
              qualities={qualities}
              title="Ваш профиль"
              teamAverage={teamAverage}
              showTeamData={teamId.length > 0 && teamAverage.length > 0}
            />
          </div>
        </div>

        {/* Командная сводка — когда есть и свои ответы, и данные команды */}
        {hasTeamData && !ownEmpty && (
          <div className="bg-card rounded-xl border border-border card-shadow p-4 md:p-5 flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground">Команда «{teamId}»</span>
              <span className="text-[11px] text-muted-foreground">{responseCount} оценок</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Средний процент</span>
              <span className={`text-sm font-semibold ${teamResult.color} tabular-nums`}>{teamPercentage}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Зона</span>
              <span className={`text-sm font-semibold ${teamResult.color}`}>{teamResult.title}</span>
            </div>
          </div>
        )}

        {/* Описание зоны — той же, что показана в карточке сверху: без своих
            ответов это команда, иначе собственный результат */}
        <div className={`rounded-xl border ${shownResult.borderColor} ${shownResult.bgColor} p-5 md:p-7`}>
          {shownResult.description.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-foreground/75 leading-relaxed text-[13px] md:text-sm mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Block results */}
        <div className="bg-card rounded-xl border border-border card-shadow p-5 md:p-7">
          <h2 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-5">Результаты по блокам</h2>
          <div className="space-y-3">
            {blockStats.map((block) => (
              <div key={block.id} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">{block.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {block.checked}/{block.total} ({block.pct}%)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      block.pct >= 80 ? 'bg-primary' :
                      block.pct >= 60 ? 'bg-[hsl(var(--chart-2))]' :
                      'bg-muted-foreground/30'
                    }`}
                    style={{ width: `${block.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weakest block */}
        {weakestBlock && (
          <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-5 md:p-7 space-y-3">
            <div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">
                Ваш главный рычаг — «{weakestBlock.label}»
              </h3>
              <p className="text-muted-foreground text-xs mt-1">
                {weakestBlock.pct}% — самый низкий результат. Здесь скрыт наибольший потенциал для роста.
              </p>
            </div>
            <div className="bg-card rounded-lg p-4 border border-border/50">
              <p className="text-[11px] text-muted-foreground mb-1 font-medium uppercase tracking-wider">Вопрос для размышления</p>
              <p className="text-sm text-foreground/80 italic leading-relaxed">
                {BLOCK_QUESTIONS[weakestBlock.id] || 'Что вы можете изменить в этом блоке уже на следующей неделе?'}
              </p>
            </div>
          </div>
        )}

        {weakestBlocks.length > 1 && (
          <div className="bg-muted/30 rounded-xl border border-border p-5 md:p-7">
            <p className="text-foreground/70 leading-relaxed text-[13px] md:text-sm">
              <span className="font-semibold text-foreground">Важно: </span>
              Блоки с результатом ниже 60% — это не слабые стороны. Это зоны, где скрыт наибольший потенциал для роста. Начните с того блока, где меньше всего «Да».
            </p>
          </div>
        )}

        {/* CTA */}
        {config.id === 'blue-ocean' && (
          <div className="rounded-xl border border-primary/15 bg-primary/[0.03] p-5 md:p-8 space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              Поделитесь результатами
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button
                variant="outline"
                size="lg"
                className="py-5 px-6"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </Button>
            </div>
          </div>
        )}

        {/* Mobile brand footer */}
        {config.id !== 'indicator-radar' && (
          <div className="sm:hidden flex justify-center pt-2 pb-4">
            <BrandLogo size="lg" />
          </div>
        )}
      </main>
    </div>
  );
};

export default BlueOceanResults;
