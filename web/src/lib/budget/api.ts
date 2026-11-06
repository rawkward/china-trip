import { request } from "../../api/client";
import type {
  BudgetCategory,
  BudgetData,
  BudgetItem,
  ItemPayload,
  ParamsDoc,
} from "./types";

export type ItemPatch = Partial<ItemPayload> & { sort?: number };

export const budgetApi = {
  get: (token: string, signal?: AbortSignal) =>
    request<BudgetData>("/api/budget", { token, signal }),

  patchParams: (patch: ParamsDoc, token: string) =>
    request<ParamsDoc>("/api/params", { method: "PATCH", body: patch, token }),

  createCategory: (name: string, token: string) =>
    request<BudgetCategory>("/api/categories", { method: "POST", body: { name }, token }),

  updateCategory: (id: string, patch: { name?: string; sort?: number }, token: string) =>
    request<BudgetCategory>("/api/categories/" + encodeURIComponent(id), {
      method: "PATCH",
      body: patch,
      token,
    }),

  deleteCategory: (id: string, token: string) =>
    request<{ deleted: boolean; items_deleted: number }>(
      "/api/categories/" + encodeURIComponent(id),
      { method: "DELETE", token },
    ),

  createItem: (payload: ItemPayload, token: string) =>
    request<BudgetItem>("/api/items", { method: "POST", body: payload, token }),

  updateItem: (id: string, patch: ItemPatch, token: string) =>
    request<BudgetItem>("/api/items/" + encodeURIComponent(id), {
      method: "PATCH",
      body: patch,
      token,
    }),

  deleteItem: (id: string, token: string) =>
    request<{ deleted: boolean }>("/api/items/" + encodeURIComponent(id), {
      method: "DELETE",
      token,
    }),
};
