import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, getAuth, setAuth } from "./auth";
import { EditsProvider, useEdits } from "./EditsContext";
import type { EditsValue } from "./EditsContext";

interface Call {
  url: string;
  method: string;
  body: unknown;
  signal?: AbortSignal;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const DAY_KEY = "hk-first|07.12";

function emptyLists() {
  return {
    notes: [] as unknown[],
    stops: [] as unknown[],
    texts: [] as unknown[],
    tags: [] as unknown[],
  };
}

interface ApiRouter {
  lists?: ReturnType<typeof emptyLists>;
  putDayNote?: (body: unknown) => Response | Promise<Response>;
  deleteDayNote?: () => Response | Promise<Response>;
  putStopNote?: (body: unknown) => Response | Promise<Response>;
  deleteStopNote?: () => Response | Promise<Response>;
  putDayTexts?: (body: unknown) => Response | Promise<Response>;
  putGuideTag?: (body: unknown) => Response | Promise<Response>;
}

function stubApi(router: ApiRouter = {}) {
  const lists = router.lists ?? emptyLists();
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body, signal: init?.signal ?? undefined });

    if (method === "GET" && url.endsWith("/api/day-notes")) return json({ notes: lists.notes });
    if (method === "GET" && url.endsWith("/api/stop-notes")) return json({ notes: lists.stops });
    if (method === "GET" && url.endsWith("/api/day-texts")) return json({ notes: lists.texts });
    if (method === "GET" && url.endsWith("/api/guide-tags")) return json({ tags: lists.tags });

    if (method === "PUT" && url.includes("/api/day-notes/")) {
      if (router.putDayNote) return router.putDayNote(body);
      const text = String((body as { body?: string })?.body ?? "").trim();
      return json({
        note: text
          ? { day_key: DAY_KEY, body: text, updated_at: 10 }
          : null,
      });
    }
    if (method === "DELETE" && url.includes("/api/day-notes/")) {
      return router.deleteDayNote ? router.deleteDayNote() : json({ ok: true });
    }
    if (method === "PUT" && url.includes("/api/stop-notes/")) {
      if (router.putStopNote) return router.putStopNote(body);
      return json({ note: { stop_key: "s", body: "x", updated_at: 11 } });
    }
    if (method === "DELETE" && url.includes("/api/stop-notes/")) {
      return router.deleteStopNote ? router.deleteStopNote() : json({ ok: true });
    }
    if (method === "PUT" && url.includes("/api/day-texts/")) {
      if (router.putDayTexts) return router.putDayTexts(body);
      const texts = (body as { texts?: Record<string, string> })?.texts ?? {};
      return json({
        note: Object.keys(texts).length
          ? { day_key: DAY_KEY, texts, updated_at: 12 }
          : null,
      });
    }
    if (method === "PUT" && url.includes("/api/guide-tags/")) {
      if (router.putGuideTag) return router.putGuideTag(body);
      return json({
        tag: { tag_key: "sight|hk|victoria-peak", tag: (body as { tag?: string })?.tag },
      });
    }
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

let current: EditsValue;

function Probe() {
  const edits = useEdits();
  current = edits;
  return <div data-testid="ready">{edits.loading ? "loading" : "ready"}</div>;
}

function renderProvider() {
  return render(
    <EditsProvider>
      <Probe />
    </EditsProvider>,
  );
}

async function waitReady() {
  await waitFor(() => expect(screen.getByTestId("ready")).toHaveTextContent("ready"));
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
  vi.useRealTimers();
});

describe("EditsProvider: загрузка слоёв", () => {
  it("при монтировании грузит все четыре слоя и раскладывает их по ключам", async () => {
    const { calls } = stubApi({
      lists: {
        notes: [{ day_key: DAY_KEY, body: "заметка", updated_at: 1 }],
        stops: [{ stop_key: DAY_KEY + "|peak", body: "остановка", updated_at: 2 }],
        texts: [{ day_key: DAY_KEY, texts: { title: "Другой заголовок" }, updated_at: 3 }],
        tags: [{ tag_key: "sight|hk|victoria-peak", tag: "alt" }],
      },
    });

    renderProvider();
    await waitReady();

    expect(current.dayNotes[DAY_KEY]).toMatchObject({ body: "заметка" });
    expect(current.stopNotes[DAY_KEY + "|peak"]).toMatchObject({ body: "остановка" });
    expect(current.dayTexts[DAY_KEY]).toEqual({ title: "Другой заголовок" });
    expect(current.guideTags["sight|hk|victoria-peak"]).toBe("alt");
    expect(calls.filter((c) => c.method === "GET")).toHaveLength(4);
  });

  it("сбой одного GET не ломает остальные слои и снимает loading", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/day-notes")) return json({ error: "boom" }, 500);
        if (url.endsWith("/api/stop-notes")) return json({ notes: [] });
        if (url.endsWith("/api/day-texts")) return json({ notes: [] });
        return json({ tags: [{ tag_key: "stay|hk|panda", tag: "choice" }] });
      }),
    );

    renderProvider();
    await waitReady();

    expect(current.dayNotes).toEqual({});
    expect(current.guideTags["stay|hk|panda"]).toBe("choice");
    expect(current.loading).toBe(false);
  });

  it("reload() перезапрашивает слои ещё раз", async () => {
    const { calls } = stubApi();
    renderProvider();
    await waitReady();
    expect(calls.filter((c) => c.method === "GET")).toHaveLength(4);

    act(() => current.reload());
    await waitFor(() => expect(calls.filter((c) => c.method === "GET")).toHaveLength(8));
  });

  it("при размонтировании отменяет запросы через AbortController", async () => {
    const { fetchMock } = stubApi();
    const { unmount } = renderProvider();
    await waitReady();

    const signals = fetchMock.mock.calls.map(([, init]) => (init as RequestInit).signal);
    expect(signals).toHaveLength(4);
    expect(signals.every((s) => s instanceof AbortSignal)).toBe(true);

    unmount();
    expect(signals.every((s) => s?.aborted)).toBe(true);
  });
});

describe("EditsProvider: правки", () => {
  it("без токена правка отклоняется понятным сообщением", async () => {
    stubApi();
    renderProvider();
    await waitReady();

    await act(async () => {
      await current.saveText(DAY_KEY, "title", "нельзя");
    });

    expect(current.error).toBe("чтобы править, войдите по паролю");
    expect(current.dayTexts[DAY_KEY]).toBeUndefined();
  });

  it("401 посреди работы закрывает правку и просит войти заново", async () => {
    setAuth("expired", Math.floor(Date.now() / 1000) + 3600);
    stubApi({
      putDayNote: () => json({ error: "unauthorized" }, 401),
    });
    renderProvider();
    await waitReady();
    expect(current.token).toBe("expired");

    await act(async () => {
      await current.saveDayNote(DAY_KEY, "текст");
    });

    expect(getAuth().token).toBeNull();
    expect(current.token).toBeNull();
    expect(current.error).toBe("правка закрыта: войдите заново");
  });

  it("ошибка сохранения текста откатывает оптимистичную правку повторной загрузкой", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    let textGets = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/day-texts")) {
          textGets += 1;
          return json({
            notes: [{ day_key: DAY_KEY, texts: { title: "исходный" }, updated_at: 1 }],
          });
        }
        if (url.endsWith("/api/day-notes")) return json({ notes: [] });
        if (url.endsWith("/api/stop-notes")) return json({ notes: [] });
        if (url.endsWith("/api/guide-tags")) return json({ tags: [] });
        if (url.includes("/api/day-texts/") && init?.method === "PUT") {
          return json({ error: "internal" }, 500);
        }
        return json({});
      }),
    );

    renderProvider();
    await waitReady();
    expect(current.dayTexts[DAY_KEY]).toEqual({ title: "исходный" });

    await act(async () => {
      await current.saveText(DAY_KEY, "title", "сломается");
    });

    await waitFor(() => expect(current.dayTexts[DAY_KEY]).toEqual({ title: "исходный" }));
    expect(textGets).toBe(2);
    expect(current.error).toBe("internal");
  });

  it("saveText с пустой строкой удаляет поле из тела PUT и из состояния", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const { calls } = stubApi({
      lists: {
        notes: [],
        stops: [],
        texts: [{ day_key: DAY_KEY, texts: { title: "заголовок", sub: "под" }, updated_at: 1 }],
        tags: [],
      },
    });
    renderProvider();
    await waitReady();

    await act(async () => {
      await current.saveText(DAY_KEY, "title", "   ");
    });

    const put = calls.find((c) => c.method === "PUT" && c.url.includes("/api/day-texts/"));
    expect(put?.body).toEqual({ texts: { sub: "под" } });
    expect(current.dayTexts[DAY_KEY]).toEqual({ sub: "под" });
    expect(current.editing.text).toBeUndefined();
    expect(current.error).toBe("");
  });

  it("saveText нормализует переводы строк и обрезает пробелы", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const { calls } = stubApi();
    renderProvider();
    await waitReady();

    await act(async () => {
      await current.saveText(DAY_KEY, "note", "  строка\r\nвторая\rтретья  ");
    });

    const put = calls.find((c) => c.method === "PUT" && c.url.includes("/api/day-texts/"));
    expect((put?.body as { texts: Record<string, string> }).texts.note).toBe(
      "строка\nвторая\nтретья",
    );
  });

  it("saveDayNote сохраняет заметку, пустая — удаляет её", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const { calls } = stubApi();
    renderProvider();
    await waitReady();

    await act(async () => {
      await current.saveDayNote(DAY_KEY, "важно");
    });
    expect(current.dayNotes[DAY_KEY]?.body).toBe("важно");
    expect(current.editing.note).toBeUndefined();

    await act(async () => {
      await current.saveDayNote(DAY_KEY, "   ");
    });
    expect(current.dayNotes[DAY_KEY]).toBeUndefined();
    expect(calls.filter((c) => c.method === "PUT")).toHaveLength(2);
  });

  it("deleteDayNote чистит локальное состояние, даже если DELETE упал", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    stubApi({
      lists: {
        notes: [{ day_key: DAY_KEY, body: "было", updated_at: 1 }],
        stops: [],
        texts: [],
        tags: [],
      },
      deleteDayNote: () => json({ error: "offline" }, 500),
    });
    renderProvider();
    await waitReady();
    expect(current.dayNotes[DAY_KEY]).toBeDefined();

    await act(async () => {
      await current.deleteDayNote(DAY_KEY);
    });

    expect(current.dayNotes[DAY_KEY]).toBeUndefined();
    expect(current.error).toBe("");
  });

  it("saveStopNote и resetStopNote обновляют только свой слой", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const stopKey = DAY_KEY + "|peak";
    stubApi({
      putStopNote: () =>
        json({ note: { stop_key: stopKey, body: "новый", updated_at: 5 } }),
      deleteStopNote: () => json({ error: "offline" }, 500),
    });
    renderProvider();
    await waitReady();

    await act(async () => {
      await current.saveStopNote(stopKey, "новый");
    });
    expect(current.stopNotes[stopKey]?.body).toBe("новый");
    expect(current.editing.stop).toBeUndefined();

    await act(async () => {
      await current.resetStopNote(stopKey);
    });
    expect(current.stopNotes[stopKey]).toBeUndefined();
    expect(current.error).toBe("");
  });

  it("saveGuideTag ставит тег оптимистично и принимает ответ сервера", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    stubApi();
    renderProvider();
    await waitReady();

    await act(async () => {
      await current.saveGuideTag("sight|hk|victoria-peak", "alt");
    });

    expect(current.guideTags["sight|hk|victoria-peak"]).toBe("alt");
    expect(current.error).toBe("");
  });

  it("ошибка saveGuideTag откатывает тег повторной загрузкой", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    let tagGets = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/api/guide-tags")) {
          tagGets += 1;
          return json({
            tags: [{ tag_key: "sight|hk|victoria-peak", tag: "rec" }],
          });
        }
        if (url.endsWith("/api/day-notes")) return json({ notes: [] });
        if (url.endsWith("/api/stop-notes")) return json({ notes: [] });
        if (url.endsWith("/api/day-texts")) return json({ notes: [] });
        if (url.includes("/api/guide-tags/") && init?.method === "PUT") {
          return json({ error: "internal" }, 500);
        }
        return json({});
      }),
    );
    renderProvider();
    await waitReady();

    await act(async () => {
      await current.saveGuideTag("sight|hk|victoria-peak", "alt");
    });

    await waitFor(() =>
      expect(current.guideTags["sight|hk|victoria-peak"]).toBe("rec"),
    );
    expect(tagGets).toBe(2);
    expect(current.error).toBe("internal");
  });

  it("setEditing сливается с прошлым состоянием, logout очищает правку", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    stubApi();
    renderProvider();
    await waitReady();

    act(() => current.setEditing({ text: "title" }));
    act(() => current.setEditing({ stop: "peak" }));
    expect(current.editing).toEqual({ text: "title", stop: "peak" });

    act(() => current.logout());
    expect(current.editing).toEqual({});
    expect(current.token).toBeNull();
    expect(current.error).toBe("");
  });
});
