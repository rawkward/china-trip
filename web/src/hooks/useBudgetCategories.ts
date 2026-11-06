import type { Dispatch, SetStateAction } from "react";
import { toast } from "../components/ui/Toast";
import { budgetApi } from "../lib/budget/api";
import { cityPrefixError, itemWord } from "../lib/budget/labels";
import { cityParamsPatch, cityPrefixes } from "../lib/budget/params";
import type {
  BudgetCategory,
  BudgetData,
  ParamsDoc,
} from "../lib/budget/types";
import type { BudgetRunner } from "./useBudgetRunner";

interface UseBudgetCategoriesOptions {
  data: BudgetData | null;
  params: ParamsDoc;
  token: string | null;
  runner: BudgetRunner;
  setData: Dispatch<SetStateAction<BudgetData | null>>;
  applyParams: (patch: ParamsDoc) => Promise<void>;
  bumpParamsReset: () => void;
  closeCreate: () => void;
  closeRename: () => void;
  closeDeleted: (category: BudgetCategory) => void;
}

export interface BudgetCategoryActions {
  createCategory: (name: string) => void;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (category: BudgetCategory) => void;
  addCity: (rawPrefix: string) => void;
}

/** Категории и города: те же PATCH/POST, что у старой страницы. */
export function useBudgetCategories({
  data,
  params,
  token,
  runner,
  setData,
  applyParams,
  bumpParamsReset,
  closeCreate,
  closeRename,
  closeDeleted,
}: UseBudgetCategoriesOptions): BudgetCategoryActions {
  const createCategory = (name: string) => {
    if (!token) return;
    runner.run(async () => {
      const created = await budgetApi.createCategory(name, token);
      setData((prev) =>
        prev ? { ...prev, categories: [...prev.categories, created] } : prev,
      );
      closeCreate();
      toast("Категория добавлена", "success");
    });
  };

  const renameCategory = (id: string, name: string) => {
    if (!token) return;
    runner.run(async () => {
      const updated = await budgetApi.updateCategory(id, { name }, token);
      setData((prev) =>
        prev
          ? {
              ...prev,
              categories: prev.categories.map((entry) => (entry.id === id ? updated : entry)),
            }
          : prev,
      );
      closeRename();
      toast("Сохранено", "success");
    });
  };

  const deleteCategory = (category: BudgetCategory) => {
    if (!data || !token) return;
    const count = data.items.filter((entry) => entry.category_id === category.id).length;
    const suffix = count > 0 ? ` и её ${count} ${itemWord(count)}` : "";
    if (!window.confirm(`Удалить категорию «${category.name}»${suffix}?`)) return;

    runner.run(async () => {
      await budgetApi.deleteCategory(category.id, token);
      setData((prev) =>
        prev
          ? {
              ...prev,
              categories: prev.categories.filter((entry) => entry.id !== category.id),
              items: prev.items.filter((entry) => entry.category_id !== category.id),
            }
          : prev,
      );
      closeDeleted(category);
      toast("Удалено", "success");
    });
  };

  const addCity = (rawPrefix: string) => {
    if (!token) return;
    const prefix = rawPrefix.trim().toLowerCase();
    const error = cityPrefixError(prefix, cityPrefixes(params));
    if (error) {
      toast(error, "error");
      return;
    }

    runner.run(async () => {
      await applyParams(cityParamsPatch(prefix));
      bumpParamsReset();
      toast("Город добавлен", "success");
    });
  };

  return { createCategory, renameCategory, deleteCategory, addCity };
}
