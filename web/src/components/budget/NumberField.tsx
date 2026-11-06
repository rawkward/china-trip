import { Input } from "../ui";
import { displayNumber, parseNumberInput } from "../../lib/budget/numbers";

export interface NumberFieldProps {
  paramKey: string;
  label: string;
  hint?: string;
  value: unknown;
  scale?: number;
  min?: number;
  max?: number;
  step?: string;
  disabled: boolean;
  resetKey: number;
  onChange: (key: string, value: number) => void;
}

/** Числовой параметр с валидацией, специфичной для ключа. */
export function NumberField({
  paramKey,
  label,
  hint,
  value,
  scale = 1,
  min = 0,
  max,
  step = "any",
  disabled,
  resetKey,
  onChange,
}: NumberFieldProps) {
  return (
    <label className="block text-[0.78rem] font-medium text-ink-soft">
      <span className="flex items-baseline justify-between gap-2">
        <span>{label}</span>
        {hint && <span className="text-[0.68rem] font-normal text-muted-soft">{hint}</span>}
      </span>
      <Input
        key={`${paramKey}:${resetKey}`}
        data-param={paramKey}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        defaultValue={displayNumber(value, scale)}
        disabled={disabled}
        className="mt-1 h-9 px-2.5 py-1 text-[0.85rem] tabular-nums"
        onChange={(event) => {
          const raw = parseNumberInput(event.currentTarget.value);
          if (raw === null) return;
          const next = raw / scale;
          if (paramKey === "people" || paramKey === "trip_days") {
            if (!Number.isInteger(next) || next < 1) return;
          } else if (paramKey === "reserve_pct") {
            if (next < 0 || next > 1) return;
          } else if (next < 0) {
            return;
          }
          onChange(paramKey, next);
        }}
      />
    </label>
  );
}
