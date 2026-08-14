interface ScaleTenProps {
  value: number;
  onChange: (value: number) => void;
  /** Оценки, которые уже израсходованы: показываем гашёными, но кликабельными,
      чтобы на нажатие можно было объяснить, почему нельзя */
  exhausted?: Set<number>;
  ariaLabel?: string;
}

/** Десятибалльная шкала: ряд кнопок 1–10, 0 означает «ещё не ответили». */
const ScaleTen = ({ value, onChange, exhausted, ariaLabel }: ScaleTenProps) => (
  <div className="flex flex-wrap gap-1" role="group" aria-label={ariaLabel}>
    {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
      const active = value === n;
      const blocked = !active && (exhausted?.has(n) ?? false);
      return (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={active}
          title={blocked ? `Оценка ${n} уже стоит у трёх мотивов` : undefined}
          className={`w-8 h-8 md:w-9 md:h-9 rounded-lg text-xs font-medium tabular-nums transition-colors duration-150 border ${
            active
              ? 'bg-primary text-primary-foreground border-primary'
              : blocked
                ? 'bg-muted/40 text-muted-foreground/35 border-border/40 line-through cursor-not-allowed'
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
