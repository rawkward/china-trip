import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { formatRub } from "@shared/budget-core.js";
import { clearAuth, setAuth } from "../../edits/auth";
import { EditsProvider } from "../../edits/EditsContext";
import { computeTotals } from "../../lib/budget/calc";
import type { BudgetData, BudgetTotals } from "../../lib/budget/types";
import { BudgetApp } from "./BudgetApp";
import { ItemsPanel } from "./ItemsPanel";
import { Summary } from "./Summary";

function jsonResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response;
}

function stubFetch(budget: "pending" | "empty" = "empty") {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/budget")) {
        if (budget === "pending") return new Promise<Response>(() => {});
        return Promise.resolve(jsonResponse({ params: {}, categories: [], items: [], version: 0 }));
      }
      return Promise.resolve(jsonResponse({ notes: [] }));
    }),
  );
}

const FIXTURE: BudgetData = {
  params: {
    cny_rate: 10,
    hkd_rate: 10,
    people: 2,
    trip_days: 5,
    reserve_pct: 0.1,
  },
  params_updated_at: 1_700_000_000,
  categories: [{ id: "cat_food", name: "Еда", sort: 0 }],
  items: [
    {
      id: "itm_1",
      category_id: "cat_food",
      name: "Обед",
      qty: 2,
      qty_formula: null,
      unit_price: 100,
      price_formula: null,
      currency: "CNY",
      note: "на двоих",
      sort: 0,
    },
  ],
  version: 1,
};

function totalsOf(data: BudgetData): BudgetTotals {
  return computeTotals(data);
}

/** Точное совпадение textContent — устойчиво к неразрывным пробелам в formatRub. */
function exactText(value: string) {
  return (_content: string, element: Element | null) => element?.textContent === value;
}

beforeEach(() => {
  localStorage.clear();
  clearAuth();
});

afterEach(() => {
  cleanup();
  clearAuth();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Summary", () => {
  it("рисует итоги, посчитанные computeBudget, и разбивку по категориям", () => {
    const totals = totalsOf(FIXTURE);
    expect(totals.base).toBe(2000);
    expect(totals.reserve).toBe(200);
    expect(totals.total).toBe(2200);

    render(<Summary totals={totals} params={FIXTURE.params} />);

    expect(screen.getByText("Итого")).toBeInTheDocument();
    expect(screen.getByText(exactText(formatRub(2200)))).toBeInTheDocument();
    expect(screen.getAllByText(exactText(formatRub(2000))).length).toBeGreaterThan(0);
    expect(screen.getByText(exactText(formatRub(200)))).toBeInTheDocument();
    expect(screen.getByText(exactText(formatRub(1100)))).toBeInTheDocument();
    expect(screen.getByText(exactText(formatRub(220)))).toBeInTheDocument();
    expect(screen.getAllByText("Еда").length).toBeGreaterThan(0);
  });
});

describe("BudgetApp: доступ", () => {
  it("без токена показывает «под паролем» и не грузит /api/budget", () => {
    stubFetch();
    render(
      <EditsProvider>
        <BudgetApp />
      </EditsProvider>,
    );

    expect(screen.getByText("Раздел закрыт паролем")).toBeInTheDocument();
    expect(screen.getByText(/личный бюджет поездки/i)).toBeInTheDocument();
    expect(screen.queryByLabelText("Пароль для правок")).not.toBeInTheDocument();

    const fetchMock = vi.mocked(fetch);
    const budgetCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/api/budget"),
    );
    expect(budgetCalls).toHaveLength(0);
  });

  it("с токеном сначала показывает кэш и помечает его", async () => {
    localStorage.setItem(
      "chinatrip.budget.cache",
      JSON.stringify({ at: Date.now(), data: FIXTURE }),
    );
    setAuth("test-token", Math.floor(Date.now() / 1000) + 3600);
    stubFetch("pending");

    render(
      <EditsProvider>
        <BudgetApp />
      </EditsProvider>,
    );

    expect((await screen.findAllByText("Еда")).length).toBeGreaterThan(0);
    expect(screen.getByText(/данные из кэша с .*обновляем/i)).toBeInTheDocument();
    expect(screen.getByText(exactText(formatRub(2200)))).toBeInTheDocument();
  });
});

describe("ItemsPanel: мутации", () => {
  const noop = () => {};

  function renderPanel(busy: boolean) {
    const totals = totalsOf(FIXTURE);
    return render(
      <ItemsPanel
        categories={FIXTURE.categories}
        items={FIXTURE.items}
        totals={totals}
        params={FIXTURE.params}
        draft={null}
        editingCategoryId={null}
        addingCategory={false}
        busy={busy}
        offline={false}
        onStartNewItem={noop}
        onEditItem={noop}
        onSaveDraft={noop}
        onCancelDraft={noop}
        onDeleteItem={noop}
        onMoveItem={noop}
        onStartRenameCategory={noop}
        onRenameCategory={noop}
        onCancelCategory={noop}
        onDeleteCategory={noop}
        onStartAddCategory={noop}
        onCreateCategory={noop}
      />,
    );
  }

  it("блокирует кнопки на время мутации", () => {
    renderPanel(true);
    const table = screen.getByRole("table");

    expect(within(table).getByRole("button", { name: "Изменить статью" })).toBeDisabled();
    expect(within(table).getByRole("button", { name: "Удалить статью" })).toBeDisabled();
    expect(within(table).getByRole("button", { name: "Переместить ниже" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "статья" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Переименовать категорию" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Удалить категорию" })).toBeDisabled();
  });

  it("без мутации кнопки доступны", () => {
    renderPanel(false);
    const table = screen.getByRole("table");
    expect(within(table).getByRole("button", { name: "Изменить статью" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "статья" })).toBeEnabled();
  });
});
