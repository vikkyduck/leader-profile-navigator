import { Info } from "lucide-react";

const ScaleLegend = () => {
  const levels = [
    { range: "0–2", label: "Начальный", description: "Навык в начале формирования", opacity: "bg-primary/10" },
    { range: "3–5", label: "Базовый", description: "Периодически проявляется", opacity: "bg-primary/20" },
    { range: "6–7", label: "Средний", description: "Регулярно применяется", opacity: "bg-primary/30" },
    { range: "8–9", label: "Продвинутый", description: "Стабильно демонстрируется", opacity: "bg-primary/50" },
    { range: "10", label: "Мастерский", description: "Естественная часть стиля", opacity: "bg-primary/70" }
  ];

  return (
    <div className="bg-card rounded-xl border border-border card-shadow p-5">
      <div className="flex items-center gap-2 mb-4">
        <Info className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Шкала оценки</h3>
      </div>
      
      <div className="space-y-2.5">
        {levels.map((level, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className={`px-2.5 py-0.5 rounded-md ${level.opacity} min-w-[48px] text-center`}>
              <span className="font-semibold text-foreground text-xs">{level.range}</span>
            </div>
            <div className="flex-1 flex items-baseline gap-2">
              <span className="text-sm font-medium text-foreground">{level.label}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">— {level.description}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">Совет:</span> Это не экзамен, а инструмент для саморефлексии. 
          Будьте честны с собой — только так вы сможете определить зоны роста.
        </p>
      </div>
    </div>
  );
};

export default ScaleLegend;
