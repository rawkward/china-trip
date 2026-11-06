import { afterEach, describe, expect, it, vi } from "vitest";
import { budgetApi } from "./api";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stub(body: unknown = {}) {
  const fetchMock = vi.fn(async () => json(body));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("budgetApi", () => {
  it("get передаёт токен и сигнал отмены", async () => {
    const fetchMock = stub({ params: {}, categories: [], items: [], version: 1 });
    const controller = new AbortController();

    const data = await budgetApi.get("tok", controller.signal);

    expect(data).toMatchObject({ version: 1 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/api/budget");
    expect(init.method).toBe("GET");
    expect(init.signal).toBe(controller.signal);
    expect(init.headers).toMatchObject({ authorization: "Bearer tok" });
  });

  it("patchParams шлёт PATCH с телом и токеном", async () => {
    const fetchMock = stub({ people: 3 });
    await expect(budgetApi.patchParams({ people: 3 }, "tok")).resolves.toEqual({ people: 3 });

    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ people: 3 }));
  });

  it("категории: создание, переименование и удаление", async () => {
    const fetchMock = stub({ id: "cat_1", name: "Еда", sort: 0 });
    await budgetApi.createCategory("Еда", "tok");
    await budgetApi.updateCategory("cat/1", { name: "Кафе" }, "tok");
    await budgetApi.deleteCategory("cat/1", "tok");

    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0][0]).toContain("/api/categories");
    expect(calls[0][1].method).toBe("POST");
    expect(calls[1][0]).toContain("/api/categories/cat%2F1");
    expect(calls[1][1].method).toBe("PATCH");
    expect(calls[1][1].body).toBe(JSON.stringify({ name: "Кафе" }));
    expect(calls[2][0]).toContain("/api/categories/cat%2F1");
    expect(calls[2][1].method).toBe("DELETE");
  });

  it("статьи: создание, правка и удаление кодируют id", async () => {
    const fetchMock = stub({ id: "itm_1" });
    const payload = {
      category_id: "cat_1",
      name: "Обед",
      currency: "CNY" as const,
      note: "",
      qty: 1,
      unit_price: 100,
    };
    await budgetApi.createItem(payload, "tok");
    await budgetApi.updateItem("itm/1", { sort: 2 }, "tok");
    await budgetApi.deleteItem("itm/1", "tok");

    const calls = fetchMock.mock.calls as unknown as Array<[string, RequestInit]>;
    expect(calls[0][0]).toContain("/api/items");
    expect(calls[0][1].method).toBe("POST");
    expect(calls[0][1].body).toBe(JSON.stringify(payload));
    expect(calls[1][0]).toContain("/api/items/itm%2F1");
    expect(calls[1][1].method).toBe("PATCH");
    expect(calls[2][0]).toContain("/api/items/itm%2F1");
    expect(calls[2][1].method).toBe("DELETE");
  });
});
