import { computeBudget } from "@shared/budget-core.js";
import type { BudgetData, BudgetTotals } from "./types";

/**
 * Тонкая обёртка над общей функцией: JS-модуль выводит параметры массивов как never[],
 * поэтому на границе один явный каст. Вся математика остаётся в shared/budget-core.js.
 */
export function computeTotals(data: Pick<BudgetData, "params" | "categories" | "items">): BudgetTotals {
  const compute = computeBudget as unknown as (input: {
    params: BudgetData["params"];
    categories: BudgetData["categories"];
    items: BudgetData["items"];
  }) => BudgetTotals;
  return compute({
    params: data.params,
    categories: data.categories,
    items: data.items,
  });
}
