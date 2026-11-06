import { useState } from "react";
import { Plus } from "lucide-react";
import { Button, Input } from "../ui";
import { cityPrefixError } from "../../lib/budget/labels";

interface AddCityFormProps {
  existing: string[];
  disabled: boolean;
  onAdd: (prefix: string) => void;
}

/** Добавление города по короткому коду: проверка и отправка префикса. */
export function AddCityForm({ existing, disabled, onAdd }: AddCityFormProps) {
  const [prefix, setPrefix] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const next = cityPrefixError(prefix, existing);
    if (next) {
      setError(next);
      return;
    }
    onAdd(prefix.trim().toLowerCase());
    setPrefix("");
    setError("");
  };

  return (
    <div className="mt-4 rounded-xl border border-dashed border-line-strong p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="block text-[0.78rem] font-medium text-ink-soft">
          Новый город
          <Input
            value={prefix}
            placeholder="например, sh"
            aria-label="Код нового города"
            disabled={disabled}
            className="mt-1 h-9 w-40 px-2.5 py-1 text-[0.85rem]"
            onChange={(event) => {
              setPrefix(event.currentTarget.value);
              setError("");
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submit();
              }
            }}
          />
        </label>
        <Button variant="soft" size="sm" disabled={disabled} onClick={submit}>
          <Plus className="size-3.5" aria-hidden="true" />
          Добавить город
        </Button>
        <span className="pb-1 text-[0.72rem] text-muted-soft">
          Четыре параметра: ночи, отель, еда, транспорт.
        </span>
      </div>
      {error && (
        <p className="mt-1 text-[0.72rem] text-accent-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
