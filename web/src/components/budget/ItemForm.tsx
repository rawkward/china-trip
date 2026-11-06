import { useEffect, useState } from "react";
import { CURRENCIES, PARAM_KEY_RE } from "@shared/budget-core.js";
import { Button, Input, Select } from "../ui";
import { buildItemPayload, DraftError } from "../../lib/budget/drafts";
import type {
  BudgetCategory,
  Currency,
  ItemDraft,
  ItemPayload,
  ParamsDoc,
} from "../../lib/budget/types";
import { FieldError } from "./FieldError";
import { OperandField } from "./OperandField";

interface ItemFormProps {
  initial: ItemDraft;
  categories: BudgetCategory[];
  params: ParamsDoc;
  busy: boolean;
  onSave: (payload: ItemPayload) => void;
  onCancel: () => void;
}

const CURRENCY_OPTIONS = Array.from(CURRENCIES as readonly Currency[]);

export function ItemForm({ initial, categories, params, busy, onSave, onCancel }: ItemFormProps) {
  const [draft, setDraft] = useState<ItemDraft>(() => ({ ...initial }));
  const [error, setError] = useState<DraftError | null>(null);

  useEffect(() => {
    setDraft({ ...initial });
    setError(null);
  }, [initial]);

  const patch = (values: Partial<ItemDraft>) => {
    setDraft((prev) => ({ ...prev, ...values }));
    setError(null);
  };

  const formulaMode = draft.qtyMode === "formula" || draft.priceMode === "formula";
  const paramNames = Object.keys(params).filter((key) => PARAM_KEY_RE.test(key));

  const submit = () => {
    try {
      const payload = buildItemPayload(draft);
      setError(null);
      onSave(payload);
    } catch (err) {
      if (err instanceof DraftError) setError(err);
      else setError(new DraftError("form", err instanceof Error ? err.message : "Не удалось сохранить"));
    }
  };

  return (
    <form
      className="rounded-xl border border-line bg-paper/60 p-3"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[0.78rem] font-medium text-ink-soft sm:col-span-2">
          Название
          <Input
            data-field="name"
            type="text"
            maxLength={120}
            autoComplete="off"
            autoFocus
            value={draft.name}
            disabled={busy}
            className="mt-1 h-9 px-2.5 py-1 text-[0.85rem]"
            onChange={(event) => patch({ name: event.currentTarget.value })}
          />
          <FieldError field="name" error={error} />
        </label>

        <OperandField
          label="Количество"
          numberField="qty"
          formulaField="qty_formula"
          mode={draft.qtyMode}
          numberValue={draft.qty}
          formulaValue={draft.qty_formula}
          placeholder="people*cq_nights"
          busy={busy}
          error={error}
          onNumberChange={(value) => patch({ qty: value })}
          onFormulaChange={(value) => patch({ qty_formula: value })}
          onToggleMode={() =>
            patch({ qtyMode: draft.qtyMode === "formula" ? "number" : "formula" })
          }
        />

        <OperandField
          label="Цена за единицу"
          numberField="unit_price"
          formulaField="price_formula"
          mode={draft.priceMode}
          numberValue={draft.unit_price}
          formulaValue={draft.price_formula}
          placeholder="cq_hotel"
          busy={busy}
          error={error}
          onNumberChange={(value) => patch({ unit_price: value })}
          onFormulaChange={(value) => patch({ price_formula: value })}
          onToggleMode={() =>
            patch({ priceMode: draft.priceMode === "formula" ? "number" : "formula" })
          }
        />

        <label className="block text-[0.78rem] font-medium text-ink-soft">
          Валюта
          <Select
            data-field="currency"
            value={draft.currency}
            disabled={busy}
            className="mt-1 h-9 py-1 text-[0.85rem]"
            onChange={(event) => patch({ currency: event.currentTarget.value as Currency })}
          >
            {CURRENCY_OPTIONS.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
          <FieldError field="currency" error={error} />
        </label>

        <label className="block text-[0.78rem] font-medium text-ink-soft">
          Категория
          <Select
            data-field="category_id"
            value={draft.category_id}
            disabled={busy}
            className="mt-1 h-9 py-1 text-[0.85rem]"
            onChange={(event) => patch({ category_id: event.currentTarget.value })}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
          <FieldError field="category_id" error={error} />
        </label>

        <label className="block text-[0.78rem] font-medium text-ink-soft sm:col-span-2">
          Комментарий
          <Input
            data-field="note"
            type="text"
            maxLength={500}
            autoComplete="off"
            value={draft.note}
            disabled={busy}
            className="mt-1 h-9 px-2.5 py-1 text-[0.85rem]"
            onChange={(event) => patch({ note: event.currentTarget.value })}
          />
          <FieldError field="note" error={error} />
        </label>
      </div>

      {formulaMode && paramNames.length > 0 && (
        <p className="mt-2 text-[0.72rem] text-muted">
          <span className="font-semibold text-ink-soft">Параметры:</span> {paramNames.join(", ")}
        </p>
      )}

      {error && error.field === "form" && (
        <p className="mt-2 text-[0.75rem] text-accent-ink" role="alert">
          {error.message}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <Button variant="primary" size="sm" type="submit" data-action="save-item" disabled={busy}>
          {busy ? "Сохраняем…" : "Сохранить"}
        </Button>
        <Button variant="ghost" size="sm" data-action="cancel-item" disabled={busy} onClick={onCancel}>
          Отмена
        </Button>
      </div>
    </form>
  );
}
