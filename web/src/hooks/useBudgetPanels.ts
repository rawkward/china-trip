import { useCallback, useState } from "react";
import { blankDraft, draftFromItem } from "../lib/budget/drafts";
import type { BudgetCategory, BudgetItem, ItemDraft } from "../lib/budget/types";

export interface BudgetPanelsState {
  draft: ItemDraft | null;
  editingCategoryId: string | null;
  addingCategory: boolean;
  reset: () => void;
  startNewItem: (categoryId: string) => void;
  editItem: (item: BudgetItem) => void;
  cancelDraft: () => void;
  clearDraft: (itemId?: string) => void;
  startRename: (id: string) => void;
  cancelCategory: () => void;
  startAddCategory: () => void;
  closeCreate: () => void;
  closeRename: () => void;
  closeDeleted: (category: BudgetCategory) => void;
}

/** Какая форма бюджета открыта: одна статья, переименование или новый город-категория. */
export function useBudgetPanels(): BudgetPanelsState {
  const [draft, setDraft] = useState<ItemDraft | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  const reset = useCallback(() => {
    setDraft(null);
    setEditingCategoryId(null);
    setAddingCategory(false);
  }, []);

  const startNewItem = useCallback((categoryId: string) => {
    setAddingCategory(false);
    setEditingCategoryId(null);
    setDraft(blankDraft(categoryId));
  }, []);

  const editItem = useCallback((item: BudgetItem) => {
    setAddingCategory(false);
    setEditingCategoryId(null);
    setDraft(draftFromItem(item));
  }, []);

  const cancelDraft = useCallback(() => setDraft(null), []);

  const clearDraft = useCallback((itemId?: string) => {
    setDraft((prev) => (itemId === undefined || (prev && prev.id === itemId) ? null : prev));
  }, []);

  const startRename = useCallback((id: string) => {
    setAddingCategory(false);
    setDraft(null);
    setEditingCategoryId(id);
  }, []);

  const cancelCategory = useCallback(() => {
    setAddingCategory(false);
    setEditingCategoryId(null);
  }, []);

  const startAddCategory = useCallback(() => {
    setDraft(null);
    setEditingCategoryId(null);
    setAddingCategory(true);
  }, []);

  const closeCreate = useCallback(() => setAddingCategory(false), []);
  const closeRename = useCallback(() => setEditingCategoryId(null), []);

  const closeDeleted = useCallback((category: BudgetCategory) => {
    setEditingCategoryId((prev) => (prev === category.id ? null : prev));
    setDraft((prev) => (prev && prev.category_id === category.id ? null : prev));
  }, []);

  return {
    draft,
    editingCategoryId,
    addingCategory,
    reset,
    startNewItem,
    editItem,
    cancelDraft,
    clearDraft,
    startRename,
    cancelCategory,
    startAddCategory,
    closeCreate,
    closeRename,
    closeDeleted,
  };
}
