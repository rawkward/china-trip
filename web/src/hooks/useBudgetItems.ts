import type { Dispatch, SetStateAction } from "react";
import { toast } from "../components/ui/Toast";
import { budgetApi } from "../lib/budget/api";
import { compareSort } from "../lib/budget/numbers";
import type {
  BudgetData,
  BudgetItem,
  ItemDraft,
  ItemPayload,
} from "../lib/budget/types";
import type { BudgetRunner } from "./useBudgetRunner";

interface UseBudgetItemsOptions {
  data: BudgetData | null;
  token: string | null;
  runner: BudgetRunner;
  setData: Dispatch<SetStateAction<BudgetData | null>>;
  clearDraft: (itemId?: string) => void;
}

export interface BudgetItemActions {
  saveDraft: (draft: ItemDraft | null, payload: ItemPayload) => void;
  deleteItem: (item: BudgetItem) => void;
  moveItem: (item: BudgetItem, delta: number) => void;
}

function replaceItemIn(data: BudgetData, item: BudgetItem): BudgetData {
  const exists = data.items.some((entry) => entry.id === item.id);
  return {
    ...data,
    items: exists
      ? data.items.map((entry) => (entry.id === item.id ? item : entry))
      : [...data.items, item],
  };
}

/** Создание, удаление и перестановка статей бюджета. */
export function useBudgetItems({
  data,
  token,
  runner,
  setData,
  clearDraft,
}: UseBudgetItemsOptions): BudgetItemActions {
  const saveDraft = (draft: ItemDraft | null, payload: ItemPayload) => {
    if (!draft || !token) return;
    runner.run(async () => {
      const saved = draft.id
        ? await budgetApi.updateItem(draft.id, payload, token)
        : await budgetApi.createItem(payload, token);
      setData((prev) => (prev ? replaceItemIn(prev, saved) : prev));
      clearDraft();
      toast("Сохранено", "success");
    });
  };

  const deleteItem = (item: BudgetItem) => {
    if (!window.confirm(`Удалить статью «${item.name}»?`)) return;
    if (!token) return;
    runner.run(async () => {
      await budgetApi.deleteItem(item.id, token);
      setData((prev) =>
        prev ? { ...prev, items: prev.items.filter((entry) => entry.id !== item.id) } : prev,
      );
      clearDraft(item.id);
      toast("Удалено", "success");
    });
  };

  const moveItem = (item: BudgetItem, delta: number) => {
    if (!data || !token) return;
    const siblings = data.items
      .filter((entry) => entry.category_id === item.category_id)
      .sort(compareSort);
    const index = siblings.findIndex((entry) => entry.id === item.id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= siblings.length) return;
    const other = siblings[target];

    runner.run(async () => {
      const [updated, updatedOther] = await Promise.all([
        budgetApi.updateItem(item.id, { sort: target }, token),
        budgetApi.updateItem(other.id, { sort: index }, token),
      ]);
      setData((prev) => {
        if (!prev) return prev;
        return replaceItemIn(replaceItemIn(prev, updated), updatedOther);
      });
    });
  };

  return { saveDraft, deleteItem, moveItem };
}
