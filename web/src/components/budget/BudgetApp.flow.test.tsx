import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, setAuth } from "../../edits/auth";
import { EditsProvider } from "../../edits/EditsContext";
import type { BudgetData } from "../../lib/budget/types";
import { Toaster } from "../ui/Toast";
import { BudgetApp } from "./BudgetApp";

const DATA: BudgetData = {
  params: {
    people: 2,
    trip_days: 5,
    reserve_pct: 0.1,
    cny_rate: 10,
    hkd_rate: 10,
    hk_nights: 2,
    hk_hotel: 1000,
    hk_food: 100,
    hk_transport: 50,
  },
  params_updated_at: 1_700_000_000,
  categories: [
    { id: "cat_food", name: "Еда", sort: 0 },
    { id: "cat_move", name: "Прочее", sort: 1 },
  ],
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
      note: "",
      sort: 0,
    },
    {
      id: "itm_2",
      category_id: "cat_food",
      name: "Ужин",
      qty: 1,
      qty_formula: null,
      unit_price: 200,
      price_formula: null,
      currency: "CNY",
      note: "",
      sort: 1,
    },
    {
      id: "itm_3",
      category_id: "cat_move",
      name: "Такси",
      qty: 1,
      qty_formula: null,
      unit_price: 300,
      price_formula: null,
      currency: "CNY",
      note: "",
      sort: 0,
    },
  ],
  version: 1,
};

const CBR = {
  Date: "2026-10-31T11:30:00+03:00",
  Valute: {
    CNY: { Value: 10, Nominal: 1 },
    HKD: { Value: 10, Nominal: 1 },
  },
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

interface RouterOptions {
  budget?: () => Response | Promise<Response>;
  cbr?: () => Response | Promise<Response>;
  params?: (body: Record<string, number>) => Response | Promise<Response>;
  deleteCategory?: () => Response | Promise<Response>;
  createCategory?: (body: Record<string, unknown>) => Response | Promise<Response>;
  updateCategory?: (id: string, body: Record<string, unknown>) => Response | Promise<Response>;
  patchItem?: (id: string, body: Record<string, unknown>) => Response | Promise<Response>;
  createItem?: (body: Record<string, unknown>) => Response | Promise<Response>;
}

function stubBudget(options: RouterOptions = {}) {
  const calls: Array<{ url: string; method: string; body?: unknown }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });

    if (url.includes("cbr-xml-daily")) {
      return options.cbr ? options.cbr() : json(CBR);
    }
    if (url.endsWith("/api/budget")) {
      return options.budget ? options.budget() : json(DATA);
    }
    if (url.endsWith("/api/params") && method === "PATCH") {
      return options.params
        ? options.params(body as Record<string, number>)
        : json({ ...DATA.params, ...(body as Record<string, number>) });
    }
    if (url.endsWith("/api/categories") && method === "POST") {
      return options.createCategory
        ? options.createCategory(body as Record<string, unknown>)
        : json({ id: "cat_new", name: (body as { name?: string }).name, sort: 2 });
    }
    if (url.includes("/api/categories/") && method === "PATCH") {
      const id = decodeURIComponent(url.split("/api/categories/")[1]);
      return options.updateCategory
        ? options.updateCategory(id, body as Record<string, unknown>)
        : json({ id, name: (body as { name?: string }).name, sort: 0 });
    }
    if (url.includes("/api/categories/") && method === "DELETE") {
      return options.deleteCategory ? options.deleteCategory() : json({ deleted: true });
    }
    if (url.includes("/api/items/") && method === "PATCH") {
      const id = decodeURIComponent(url.split("/api/items/")[1]);
      const item = DATA.items.find((entry) => entry.id === id) ?? DATA.items[0];
      return options.patchItem
        ? options.patchItem(id, body as Record<string, unknown>)
        : json({ ...item, ...(body as Record<string, unknown>) });
    }
    if (url.endsWith("/api/items") && method === "POST") {
      return options.createItem
        ? options.createItem(body as Record<string, unknown>)
        : json({ ...DATA.items[0], id: "itm_new", ...(body as Record<string, unknown>) });
    }
    if (url.endsWith("/api/day-notes")) return json({ notes: [] });
    if (url.endsWith("/api/stop-notes")) return json({ notes: [] });
    if (url.endsWith("/api/day-texts")) return json({ notes: [] });
    if (url.endsWith("/api/guide-tags")) return json({ tags: [] });
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

function renderBudget() {
  return render(
    <EditsProvider>
      <BudgetApp />
      <Toaster />
    </EditsProvider>,
  );
}

async function waitReady() {
  await screen.findByText("Итого", {}, { timeout: 5_000 });
}

function category(name: string) {
  const node = document.querySelector<HTMLElement>(`[data-category="${name}"]`);
  if (!node) throw new Error("нет категории " + name);
  return node;
}

beforeEach(() => {
  localStorage.clear();
  clearAuth();
  setAuth("token", Math.floor(Date.now() / 1000) + 3600);
});

afterEach(() => {
  cleanup();
  clearAuth();
  localStorage.clear();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("BudgetApp: состояния загрузки", () => {
  it("без кэша сначала рисует скелетон, затем данные", async () => {
    let resolveBudget: ((response: Response) => void) | null = null;
    stubBudget({
      budget: () =>
        new Promise<Response>((resolve) => {
          resolveBudget = resolve;
        }),
    });

    renderBudget();
    expect(screen.getByLabelText("Загружаем бюджет")).toBeInTheDocument();

    await act(async () => {
      resolveBudget?.(json(DATA));
    });

    await waitReady();
    expect(screen.queryByLabelText("Загружаем бюджет")).not.toBeInTheDocument();
    expect(screen.getAllByText("Обед").length).toBeGreaterThan(0);
  });

  it("ошибка загрузки показывает текст и повторный запрос по кнопке", async () => {
    let attempt = 0;
    stubBudget({
      budget: () => {
        attempt += 1;
        if (attempt === 1) return Promise.reject(new Error("offline"));
        return json(DATA);
      },
    });

    renderBudget();

    expect(await screen.findByText("Не удалось загрузить бюджет")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("нет связи с сервером");

    fireEvent.click(screen.getByRole("button", { name: "Повторить" }));
    await waitReady();
    expect(attempt).toBe(2);
  });

  it("при живом кэше и упавшем GET показывает офлайн и блокирует мутации", async () => {
    localStorage.setItem(
      "chinatrip.budget.cache",
      JSON.stringify({ at: Date.now(), data: DATA }),
    );
    const { calls } = stubBudget({ budget: () => Promise.reject(new Error("offline")) });

    renderBudget();

    expect(await screen.findByText(/данные из кэша с .*офлайн/i)).toBeInTheDocument();
    expect(screen.getAllByText("Обед").length).toBeGreaterThan(0);

    vi.spyOn(window, "confirm").mockReturnValue(true);
    const deleteCategory = within(category("cat_food")).getByRole("button", {
      name: "Удалить категорию",
    });
    expect(deleteCategory).toBeDisabled();
    fireEvent.click(deleteCategory);

    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
  });

  it("сбой курса ЦБ не роняет раздел и показывает тост", async () => {
    stubBudget({ cbr: () => json({ error: "down" }, 500) });

    renderBudget();
    await waitReady();

    expect(await screen.findByText("курс ЦБ не получен")).toBeInTheDocument();
    expect(screen.getByText("Параметры")).toBeInTheDocument();
    expect(screen.getAllByText("Обед").length).toBeGreaterThan(0);
  });
});

describe("BudgetApp: параметры", () => {
  it("несколько быстрых правок дают один PATCH /api/params после дебаунса", async () => {
    const { calls } = stubBudget();
    renderBudget();
    await waitReady();

    vi.useFakeTimers();
    const people = document.querySelector<HTMLInputElement>('[data-param="people"]');
    const tripDays = document.querySelector<HTMLInputElement>('[data-param="trip_days"]');
    expect(people).not.toBeNull();
    expect(tripDays).not.toBeNull();

    fireEvent.change(people!, { target: { value: "3" } });
    const tripDaysAfterRender = document.querySelector<HTMLInputElement>(
      '[data-param="trip_days"]',
    );
    expect(tripDaysAfterRender).not.toBeNull();
    fireEvent.change(tripDaysAfterRender!, { target: { value: "6" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(650);
    });

    const patches = calls.filter((c) => c.method === "PATCH" && c.url.endsWith("/api/params"));
    expect(patches).toHaveLength(1);
    expect(patches[0].body).toEqual({ people: 3, trip_days: 6 });
  });
});

describe("BudgetApp: мутации", () => {
  it("удаление категории уносит и её статьи", async () => {
    const { calls } = stubBudget();
    renderBudget();
    await waitReady();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    fireEvent.click(
      within(category("cat_food")).getByRole("button", { name: "Удалить категорию" }),
    );

    await waitFor(() => {
      expect(document.querySelector('[data-category="cat_food"]')).toBeNull();
    });
    expect(screen.queryAllByText("Обед")).toHaveLength(0);
    expect(screen.queryAllByText("Ужин")).toHaveLength(0);
    expect(screen.getAllByText("Такси").length).toBeGreaterThan(0);
    expect(calls.some((c) => c.method === "DELETE" && c.url.includes("cat_food"))).toBe(true);
  });

  it("перестановка статьи вниз отправляет правильные sort и меняет порядок", async () => {
    const { calls } = stubBudget();
    renderBudget();
    await waitReady();

    const table = within(category("cat_food")).getByRole("table");
    fireEvent.click(within(table).getAllByRole("button", { name: "Переместить ниже" })[0]);

    await waitFor(() => {
      const itemPatches = calls.filter(
        (c) => c.method === "PATCH" && c.url.includes("/api/items/"),
      );
      expect(itemPatches).toHaveLength(2);
    });

    const patches = calls.filter((c) => c.method === "PATCH" && c.url.includes("/api/items/"));
    expect(patches.find((c) => c.url.endsWith("/itm_1"))?.body).toEqual({ sort: 1 });
    expect(patches.find((c) => c.url.endsWith("/itm_2"))?.body).toEqual({ sort: 0 });

    await waitFor(() => {
      const rows = Array.from(
        category("cat_food").querySelectorAll<HTMLTableRowElement>("tbody tr[data-item]"),
      );
      expect(rows.map((row) => row.dataset.item)).toEqual(["itm_2", "itm_1"]);
    });
  });

  it("отказ мутации блокирует кнопки на время запроса и разблокирует после ошибки", async () => {
    let rejectDelete: ((response: Response) => void) | null = null;
    stubBudget({
      deleteCategory: () =>
        new Promise<Response>((resolve) => {
          rejectDelete = resolve;
        }),
    });
    renderBudget();
    await waitReady();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    const button = within(category("cat_food")).getByRole("button", {
      name: "Удалить категорию",
    });
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeDisabled());

    await act(async () => {
      rejectDelete?.(json({ error: "internal" }, 500));
    });

    await waitFor(() => expect(button).toBeEnabled());
    expect(await screen.findByText("внутренняя ошибка сервера")).toBeInTheDocument();
    expect(screen.getAllByText("Обед").length).toBeGreaterThan(0);
  });

  it("создание категории проверяет имя и добавляет её в список", async () => {
    const { calls } = stubBudget();
    renderBudget();
    await waitReady();

    fireEvent.click(screen.getByRole("button", { name: "категория" }));
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Укажите название категории");

    fireEvent.change(screen.getByLabelText("Название категории"), {
      target: { value: "Сувениры" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/api/categories"))).toBe(true);
    });
    expect(await screen.findByRole("heading", { name: "Сувениры" })).toBeInTheDocument();
  });

  it("переименование категории отправляет PATCH и обновляет заголовок", async () => {
    const { calls } = stubBudget();
    renderBudget();
    await waitReady();

    fireEvent.click(
      within(category("cat_food")).getByRole("button", { name: "Переименовать категорию" }),
    );
    const input = screen.getByLabelText("Название категории");
    expect(input).toHaveValue("Еда");
    fireEvent.change(input, { target: { value: "Кафе" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      const rename = calls.find(
        (c) => c.method === "PATCH" && c.url.endsWith("/api/categories/cat_food"),
      );
      expect(rename?.body).toEqual({ name: "Кафе" });
    });
    expect(await screen.findByRole("heading", { name: "Кафе" })).toBeInTheDocument();
  });

  it("новый город отправляет четыре нулевых параметра", async () => {
    const { calls } = stubBudget();
    renderBudget();
    await waitReady();

    fireEvent.change(screen.getByLabelText("Код нового города"), { target: { value: "sh" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить город" }));

    await waitFor(() => {
      const patch = calls.find((c) => c.method === "PATCH" && c.url.endsWith("/api/params"));
      expect(patch?.body).toEqual({
        sh_nights: 0,
        sh_hotel: 0,
        sh_food: 0,
        sh_transport: 0,
      });
    });
  });

  it("курс ЦБ предлагает обновление и применяет его к параметрам", async () => {
    const { calls } = stubBudget({
      cbr: () =>
        json({
          Date: "2026-10-31T11:30:00+03:00",
          Valute: {
            CNY: { Value: 12, Nominal: 1 },
            HKD: { Value: 11, Nominal: 1 },
          },
        }),
    });
    renderBudget();
    await waitReady();

    fireEvent.click(await screen.findByRole("button", { name: "Обновить" }));

    await waitFor(() => {
      const patch = calls.find((c) => c.method === "PATCH" && c.url.endsWith("/api/params"));
      expect(patch?.body).toEqual({ cny_rate: 12, hkd_rate: 11 });
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Обновить" })).not.toBeInTheDocument();
    });
    expect(screen.getAllByText(/¥12,0000/).length).toBeGreaterThan(0);
  });

  it("добавление статьи через форму создаёт запись и показывает её", async () => {
    const { calls } = stubBudget();
    renderBudget();
    await waitReady();

    fireEvent.click(
      within(category("cat_food")).getByRole("button", { name: "статья" }),
    );

    const nameInput = screen.getAllByLabelText("Название")[0];
    const form = nameInput.closest("form");
    expect(form).not.toBeNull();

    fireEvent.change(nameInput, { target: { value: "Новый обед" } });
    fireEvent.change(within(form!).getByLabelText(/Цена за единицу/), {
      target: { value: "150" },
    });
    fireEvent.click(within(form!).getByRole("button", { name: "Сохранить" }));

    await waitFor(() => {
      expect(calls.some((c) => c.method === "POST" && c.url.endsWith("/api/items"))).toBe(true);
    });
    const post = calls.find((c) => c.method === "POST" && c.url.endsWith("/api/items"));
    expect(post?.body).toMatchObject({
      category_id: "cat_food",
      name: "Новый обед",
      unit_price: 150,
      qty: 1,
      currency: "CNY",
    });
    expect((await screen.findAllByText(/Новый обед/)).length).toBeGreaterThan(0);
  });
});
