interface ScaleTenProps {
  value: number;
  onChange: (value: number) => void;
  /** Подсветить как проблемный — например, если оценка нарушает правило анкеты */
  warn?: boolean;
  ariaLabel?: string;
}

/** Десятибалльная шкала: ряд кнопок 1–10, 0 означает «ещё не ответили». */
const ScaleTen = ({ value, onChange, warn, ariaLabel }: ScaleTenProps) => (
  <div className="flex flex-wrap gap-1" role="group" aria-label={ariaLabel}>
    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
      const active = value === n;
      return (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={active}
          className={`w-8 h-8 md:w-9 md:h-9 rounded-lg text-xs font-medium tabular-nums transition-colors duration-150 border ${
            active
              ? warn
                ? 'bg-[hsl(var(--chart-2))] text-white border-[hsl(var(--chart-2))]'
                : 'bg-primary text-primary-foreground border-primary'
              : 'bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {n}
        </button>
      );
    })}
  </div>
);

export default ScaleTen;
