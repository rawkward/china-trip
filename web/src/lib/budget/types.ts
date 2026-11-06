/** Типы документов бюджета: те же, что отдаёт Worker (/api/budget). */

export type Currency = "RUB" | "CNY" | "HKD";

export type ParamsDoc = Record<string, number>;

export interface BudgetCategory {
  id: string;
  name: string;
  sort: number;
  created_at?: number;
  updated_at?: number;
}

export interface BudgetItem {
  id: string;
  category_id: string;
  name: string;
  qty: number | null;
  qty_formula: string | null;
  unit_price: number | null;
  price_formula: string | null;
  currency: Currency;
  note: string;
  sort: number;
  created_at?: number;
  updated_at?: number;
}

export interface BudgetData {
  params: ParamsDoc;
  params_updated_at: number | null;
  categories: BudgetCategory[];
  items: BudgetItem[];
  version: number;
}

export interface BudgetTotals {
  params: ParamsDoc;
  base: number;
  reserve: number;
  total: number;
  perPerson: number;
  perDay: number;
  categories: Array<{ id: string | null; name: string; subtotal: number; count: number }>;
}

export interface FxRate {
  cny: number;
  hkd: number;
  date: string;
}

export interface CachedBudget {
  at: number;
  data: BudgetData;
}

export type OperandMode = "number" | "formula";

/** Черновик статьи: числа храним строками, чтобы не терять то, что человек набрал. */
export interface ItemDraft {
  id: string | null;
  category_id: string;
  name: string;
  qty: string;
  qty_formula: string;
  qtyMode: OperandMode;
  unit_price: string;
  price_formula: string;
  priceMode: OperandMode;
  currency: Currency;
  note: string;
}

export interface ItemPayload {
  category_id: string;
  name: string;
  currency: Currency;
  note: string;
  qty?: number;
  qty_formula?: string;
  unit_price?: number;
  price_formula?: string;
}
