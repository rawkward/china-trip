import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { blankDraft, draftFromItem } from "../../lib/budget/drafts";
import type { BudgetCategory, BudgetItem, ParamsDoc } from "../../lib/budget/types";
import { ItemForm } from "./ItemForm";

const categories: BudgetCategory[] = [
  { id: "cat_food", name: "Еда", sort: 0 },
  { id: "cat_move", name: "Прочее", sort: 1 },
];

const params: ParamsDoc = { people: 2, hk_nights: 3, hk_hotel: 1000 };

function renderForm(initial = blankDraft("cat_food"), busy = false) {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <ItemForm
      initial={initial}
      categories={categories}
      params={params}
      busy={busy}
      onSave={onSave}
      onCancel={onCancel}
    />,
  );
  return { ...view, onSave, onCancel };
}

function field<T extends HTMLElement = HTMLInputElement>(name: string): T {
  const node = document.querySelector<T>(`[data-field="${name}"]`);
  if (!node) throw new Error("нет поля " + name);
  return node;
}

describe("ItemForm", () => {
  it("не отправляет форму без названия и показывает ошибку у поля", () => {
    const { onSave } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Укажите название статьи");
  });

  it("собирает обычную статью с числом и валютой", () => {
    const { onSave } = renderForm();

    fireEvent.change(field("name"), { target: { value: "  Обед  " } });
    fireEvent.change(field("qty"), { target: { value: "2" } });
    fireEvent.change(field("unit_price"), { target: { value: "120.5" } });
    fireEvent.change(field("note"), { target: { value: "на двоих" } });
    fireEvent.change(field("currency"), { target: { value: "HKD" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSave).toHaveBeenCalledWith({
      category_id: "cat_food",
      name: "Обед",
      currency: "HKD",
      note: "на двоих",
      qty: 2,
      unit_price: 120.5,
    });
  });

  it("переключает количество и цену в режим формулы и показывает доступные параметры", () => {
    const { onSave } = renderForm();
    fireEvent.change(field("name"), { target: { value: "Отель" } });

    const buttons = screen.getAllByRole("button", { name: "формула" });
    fireEvent.click(buttons[0]);
    fireEvent.change(field("qty_formula"), { target: { value: " people*hk_nights " } });
    expect(screen.getByText(/people, hk_nights/)).toBeInTheDocument();

    fireEvent.click(buttons[1]);
    fireEvent.change(field("price_formula"), { target: { value: "hk_hotel" } });

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSave).toHaveBeenCalledWith({
      category_id: "cat_food",
      name: "Отель",
      currency: "CNY",
      note: "",
      qty_formula: "people*hk_nights",
      price_formula: "hk_hotel",
    });
  });

  it("пустая формула не даёт сохранить и подсвечивает поле", () => {
    const { onSave } = renderForm();
    fireEvent.change(field("name"), { target: { value: "Отель" } });

    fireEvent.click(screen.getAllByRole("button", { name: "формула" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Укажите формулу количества");
  });

  it("восстанавливает черновик из статьи и отдаёт отмену наружу", () => {
    const item: BudgetItem = {
      id: "itm_1",
      category_id: "cat_move",
      name: "Такси",
      qty: null,
      qty_formula: "people",
      unit_price: 300,
      price_formula: null,
      currency: "RUB",
      note: "аэропорт",
      sort: 0,
    };
    const { onCancel } = renderForm(draftFromItem(item));

    expect(field("name")).toHaveValue("Такси");
    expect(field("qty_formula")).toHaveValue("people");
    expect(field("unit_price")).toHaveValue(300);
    expect(field("currency")).toHaveValue("RUB");

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("в занятом состоянии блокирует поля и кнопки", () => {
    renderForm(blankDraft("cat_food"), true);

    expect(field("name")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Сохраняем…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeDisabled();
    const form = field("name").closest("form");
    expect(form).not.toBeNull();
    expect(within(form!).getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(
      true,
    );
  });
});
