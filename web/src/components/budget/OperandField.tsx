import type { DraftError } from "../../lib/budget/drafts";
import type { OperandMode } from "../../lib/budget/types";
import { Button, Input } from "../ui";
import { FieldError } from "./FieldError";

interface OperandFieldProps {
  label: string;
  numberField: string;
  formulaField: string;
  mode: OperandMode;
  numberValue: string;
  formulaValue: string;
  placeholder: string;
  busy: boolean;
  error: DraftError | null;
  onNumberChange: (value: string) => void;
  onFormulaChange: (value: string) => void;
  onToggleMode: () => void;
}

/** Поле «количество» или «цена»: число либо формула, переключатель режима. */
export function OperandField({
  label,
  numberField,
  formulaField,
  mode,
  numberValue,
  formulaValue,
  placeholder,
  busy,
  error,
  onNumberChange,
  onFormulaChange,
  onToggleMode,
}: OperandFieldProps) {
  const isFormula = mode === "formula";

  return (
    <div>
      <label className="block text-[0.78rem] font-medium text-ink-soft">
        {label}
        <span className="mt-1 flex items-center gap-2">
          {isFormula ? (
            <Input
              data-field={formulaField}
              type="text"
              maxLength={200}
              autoComplete="off"
              value={formulaValue}
              placeholder={placeholder}
              disabled={busy}
              className="h-9 px-2.5 py-1 font-mono text-[0.82rem]"
              onChange={(event) => onFormulaChange(event.currentTarget.value)}
            />
          ) : (
            <Input
              data-field={numberField}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={numberValue}
              disabled={busy}
              className="h-9 px-2.5 py-1 text-[0.85rem] tabular-nums"
              onChange={(event) => onNumberChange(event.currentTarget.value)}
            />
          )}
          <Button
            variant={isFormula ? "primary" : "soft"}
            size="sm"
            aria-pressed={isFormula}
            disabled={busy}
            onClick={onToggleMode}
          >
            формула
          </Button>
        </span>
      </label>
      <FieldError field={numberField} error={error} />
      <FieldError field={formulaField} error={error} />
    </div>
  );
}
