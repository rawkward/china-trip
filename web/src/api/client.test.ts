import { afterEach, describe, expect, it, vi } from "vitest";
import { api, API_BASE, ApiError, request } from "./client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API_BASE", () => {
  it("по умолчанию — боевой Pages-проект", () => {
    expect(API_BASE).toBe("https://china-trip-api.pages.dev");
  });
});

describe("request", () => {
  it("отдаёт JSON и кладёт токен в заголовок", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const data = await request<{ ok: boolean }>("/api/x", { token: "t0ken" });

    expect(data).toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(API_BASE + "/api/x");
    expect((init as RequestInit).headers).toMatchObject({ authorization: "Bearer t0ken" });
  });

  it("ошибку сервера превращает в ApiError с текстом из details", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: "validation", details: [{ field: "body", message: "слишком длинно" }] }, 422),
      ),
    );

    await expect(request("/api/day-notes/k", { method: "PUT", body: {} })).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "слишком длинно",
    });
  });

  it("ошибка без details даёт generic-текст", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(request("/api/x")).rejects.toThrow("ошибка 500");
  });

  it("не-JSON ответ не ломает разбор", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>", { status: 200 })));
    await expect(request("/api/x")).resolves.toBeNull();
  });

  it("сетевая ошибка — статус 0 и понятный текст", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(request("/api/x")).rejects.toMatchObject({ status: 0, message: "нет связи с сервером" });
  });

  it("AbortError пробрасывается как есть", async () => {
    const abort = new Error("aborted");
    abort.name = "AbortError";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abort));
    await expect(request("/api/x")).rejects.toBe(abort);
  });

  it("ApiError — экземпляр Error с деталями", () => {
    const err = new ApiError(401, "нет", [{ message: "войдите" }]);
    expect(err).toBeInstanceOf(Error);
    expect(err.details).toHaveLength(1);
  });
});

describe("хелперы API", () => {
  it("login разворачивает expires_at в expiresAt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ token: "abc", expires_at: 1700000000 })),
    );
    await expect(api.login("pass")).resolves.toEqual({ token: "abc", expiresAt: 1700000000 });
  });

  it("списки возвращают пустые массивы, если тел нет", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({}))));
    await expect(api.listDayNotes()).resolves.toEqual([]);
    await expect(api.listStopNotes()).resolves.toEqual([]);
    await expect(api.listDayTexts()).resolves.toEqual([]);
    await expect(api.listGuideTags()).resolves.toEqual([]);
  });

  it("putDayNote кодирует ключ с вертикальной чертой", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ note: { day_key: "hk-first|07.12", body: "x", updated_at: 1 } }));
    vi.stubGlobal("fetch", fetchMock);
    const note = await api.putDayNote("hk-first|07.12", "x", "tok");
    expect(note?.body).toBe("x");
    expect(fetchMock.mock.calls[0][0]).toContain("/api/day-notes/hk-first%7C07.12");
  });

  it("putDayTexts возвращает карту текстов или null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ note: { day_key: "k", texts: { order: "a,b" }, updated_at: 1 } })));
    await expect(api.putDayTexts("k", { order: "a,b" }, "tok")).resolves.toEqual({ order: "a,b" });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ note: null })));
    await expect(api.putDayTexts("k", {}, "tok")).resolves.toBeNull();
  });
});
