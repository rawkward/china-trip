import { cn } from "../../lib/cn";
import { Button } from "./index";

export interface DayTargetOption {
  key: string;
  label: string;
  taken?: boolean;
  hint?: string;
}

export interface DayTargetPickerProps {
  options: DayTargetOption[];
  ariaLabel: string;
  onPick: (key: string) => void;
  onClose: () => void;
}

/** Маленькая панель выбора дня для добавления или переноса остановки. */
export function DayTargetPicker({ options, ariaLabel, onPick, onClose }: DayTargetPickerProps) {
  return (
    <div
      role="list"
      aria-label={ariaLabel}
      className="mt-2 flex max-h-60 flex-col gap-1 overflow-auto rounded-xl border border-line bg-surface p-1.5"
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          disabled={option.taken}
          aria-label={"день " + option.label}
          className={cn(
            "rounded-lg border px-2 py-1 text-left text-[0.78rem] transition-colors",
            option.taken
              ? "cursor-not-allowed border-line bg-paper-deep/40 text-muted"
              : "border-line bg-surface text-ink hover:border-accent hover:text-accent",
          )}
          onClick={() => onPick(option.key)}
        >
          {option.label}
          {option.taken ? " · " + (option.hint ?? "уже тут") : option.hint ? " · " + option.hint : ""}
        </button>
      ))}
      {!options.length && (
        <span className="px-1 py-0.5 text-[0.76rem] text-muted">дней нет</span>
      )}
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={onClose}>
          готово
        </Button>
      </div>
    </div>
  );
}
