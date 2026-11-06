import { CURRENCIES, LIMITS } from "@shared/budget-core.js";
import { parseNumberInput } from "./numbers";
import type { BudgetItem, Currency, ItemDraft, ItemPayload } from "./types";

const CURRENCY_SET = new Set<string>(Array.from(CURRENCIES as readonly string[]));

export function isCurrency(value: unknown): value is Currency {
  return typeof value === "string" && CURRENCY_SET.has(value);
}

/** Ошибка формы с полем — чтобы подпись встала под нужным инпутом. */
export class DraftError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = "DraftError";
    this.field = field;
  }
}

export function blankDraft(categoryId: string): ItemDraft {
  return {
    id: null,
    category_id: categoryId,
    name: "",
    qty: "1",
    qty_formula: "",
    qtyMode: "number",
    unit_price: "0",
    price_formula: "",
    priceMode: "number",
    currency: "CNY",
    note: "",
  };
}

export function draftFromItem(item: BudgetItem): ItemDraft {
  return {
    id: item.id,
    category_id: item.category_id,
    name: item.name || "",
    qty: item.qty === null || item.qty === undefined ? "" : String(item.qty),
    qty_formula: item.qty_formula || "",
    qtyMode: item.qty_formula !== null && item.qty_formula !== undefined ? "formula" : "number",
    unit_price:
      item.unit_price === null || item.unit_price === undefined ? "" : String(item.unit_price),
    price_formula: item.price_formula || "",
    priceMode:
      item.price_formula !== null && item.price_formula !== undefined ? "formula" : "number",
    currency: isCurrency(item.currency) ? item.currency : "CNY",
    note: item.note || "",
  };
}

/** Проверяет черновик и собирает тело POST/PATCH /api/items. Бросает DraftError. */
export function buildItemPayload(draft: ItemDraft): ItemPayload {
  const name = String(draft.name || "").trim();
  if (!name) throw new DraftError("name", "Укажите название статьи");
  if (name.length > LIMITS.itemName) {
    throw new DraftError("name", `Название длиннее ${LIMITS.itemName} символов`);
  }

  const note = String(draft.note || "").trim();
  if (note.length > LIMITS.note) {
    throw new DraftError("note", `Комментарий длиннее ${LIMITS.note} символов`);
  }

  if (!isCurrency(draft.currency)) {
    throw new DraftError("currency", "Выберите валюту");
  }

  if (typeof draft.category_id !== "string" || draft.category_id.trim() === "") {
    throw new DraftError("category_id", "Выберите категорию");
  }

  const payload: ItemPayload = {
    category_id: draft.category_id,
    name,
    currency: draft.currency,
    note,
  };

  if (draft.qtyMode === "formula") {
    const formula = String(draft.qty_formula || "").trim();
    if (!formula) throw new DraftError("qty_formula", "Укажите формулу количества");
    payload.qty_formula = formula;
  } else {
    const qty = parseNumberInput(draft.qty);
    if (qty === null || qty < 0) {
      throw new DraftError("qty", "Количество должно быть числом ≥ 0");
    }
    payload.qty = qty;
  }

  if (draft.priceMode === "formula") {
    const formula = String(draft.price_formula || "").trim();
    if (!formula) throw new DraftError("price_formula", "Укажите формулу цены");
    payload.price_formula = formula;
  } else {
    const price = parseNumberInput(draft.unit_price);
    if (price === null || price < 0) {
      throw new DraftError("unit_price", "Цена должна быть числом ≥ 0");
    }
    payload.unit_price = price;
  }

  return payload;
}
