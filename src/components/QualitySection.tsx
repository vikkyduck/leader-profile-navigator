import { useState } from 'react';
import { ChevronDown, Check, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CriterionWithTitle } from '@/types/leader';

interface QualitySectionProps {
  id: string;
  label: string;
  score: number;
  criteria: CriterionWithTitle[];
  checkedCriteria: boolean[];
  onCriteriaChange: (qualityId: string, criterionIndex: number, checked: boolean) => void;
  index?: number;
  onFirstOpen?: () => void;
}

const QualitySection = ({ 
  id, 
  label, 
  score, 
  criteria, 
  checkedCriteria,
  onCriteriaChange,
  index = 0,
  onFirstOpen,
}: QualitySectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const checkedCount = checkedCriteria.filter(Boolean).length;
  const total = criteria.length;
  const isComplete = checkedCount === total && total > 0;
  const hasAny = checkedCount > 0;
  const progress = total > 0 ? (checkedCount / total) * 100 : 0;

  return (
    <div 
      className={cn(
        "rounded-xl border transition-all duration-200",
        isComplete
          ? "bg-card border-[hsl(var(--success)/0.25)] card-shadow-lg"
          : hasAny
            ? "bg-card border-primary/15 card-shadow-lg"
            : "bg-card border-border card-shadow hover:border-border/70",
      )}
    >
      <button
        onClick={() => {
          if (!isOpen && !hasBeenOpened) {
            setHasBeenOpened(true);
            onFirstOpen?.();
          }
          setIsOpen(!isOpen);
        }}
        className="w-full p-4 md:p-5 text-left group"
      >
        <div className="flex justify-between items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              "flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center text-xs font-semibold transition-colors duration-200",
              isComplete
                ? "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]"
                : hasAny
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            )}>
              {isComplete ? (
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              ) : hasAny ? (
                <span className="text-[11px]">{checkedCount}/{total}</span>
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-medium text-foreground truncate">{label}</h3>
              {!isOpen && !hasAny && (
                <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5">{total} критериев</p>
              )}
              {!isOpen && hasAny && (
                <div className="flex gap-[3px] mt-1.5">
                  {criteria.map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "w-3.5 md:w-4 h-1 rounded-full transition-colors",
                        checkedCriteria[i] 
                          ? isComplete ? "bg-[hsl(var(--success))]" : "bg-primary"
                          : "bg-border"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            "w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0",
            isOpen 
              ? "bg-primary text-primary-foreground rotate-180" 
              : "bg-muted/60 text-muted-foreground group-hover:bg-muted"
          )}>
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </button>

      <div 
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 md:px-5 pb-4 md:pb-5 space-y-0.5">
            {/* Hint when nothing checked */}
            {!hasAny && (
              <div className="flex items-center gap-2 py-2 px-3 mb-2 rounded-lg bg-primary/[0.05] border border-primary/10">
                <CheckSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs text-primary/80 font-medium">
                  Отметьте все пункты, которые подходят
                </span>
              </div>
            )}

            {/* Progress bar when items checked */}
            {hasAny && (
              <div className="flex items-center gap-3 pb-3 mb-2 border-b border-border/50">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-400",
                      isComplete ? "bg-[hsl(var(--success))]" : "bg-primary"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                  {checkedCount}/{total}
                </span>
              </div>
            )}

            {criteria.map((criterion, idx) => (
              <label 
                key={idx}
                className={cn(
                  "flex items-start cursor-pointer group/item rounded-lg p-2.5 md:p-3 transition-colors duration-150 min-h-[44px]",
                  checkedCriteria[idx]
                    ? "bg-primary/[0.04]"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={checkedCriteria[idx]}
                    onChange={(e) => onCriteriaChange(id, idx, e.target.checked)}
                    className="custom-checkbox"
                  />
                </div>
                <div className="ml-2.5 md:ml-3 flex-1">
                  <p className={cn(
                    "text-[13px] md:text-sm font-medium leading-snug transition-colors",
                    checkedCriteria[idx]
                      ? "text-foreground"
                      : "text-foreground/70 group-hover/item:text-foreground/90"
                  )}>
                    {criterion.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {criterion.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualitySection;
