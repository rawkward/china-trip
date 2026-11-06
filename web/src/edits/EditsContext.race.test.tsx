import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditsProvider, useEdits } from "./EditsContext";
import { setAuth } from "./auth";
import type { EditsValue } from "./EditsContext";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

let api: EditsValue | null = null;

function Probe() {
  const edits = useEdits();
  api = edits;
  return <div>{edits.token ? "auth" : "anon"}</div>;
}

/** Тело каждого PUT /api/day-texts, в порядке отправки. */
const putBodies: Record<string, string>[] = [];

function stubApi(delayMs = 0) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/api/day-texts/") && method === "PUT") {
        const body = JSON.parse(String(init?.body ?? "{}")) as { texts: Record<string, string> };
        putBodies.push(body.texts);
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
        return jsonResponse({ note: { day_key: "k", texts: body.texts, updated_at: 1 } });
      }
      if (url.includes("/api/day-texts")) return jsonResponse({ notes: [] });
      if (url.includes("/api/day-notes")) return jsonResponse({ notes: [] });
      if (url.includes("/api/stop-notes")) return jsonResponse({ notes: [] });
      if (url.includes("/api/guide-tags")) return jsonResponse({ tags: [] });
      return jsonResponse({});
    }),
  );
}

beforeEach(() => {
  api = null;
  putBodies.length = 0;
  localStorage.clear();
  setAuth("test-token", Math.floor(Date.now() / 1000) + 3600);
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("saveText под нагрузкой", () => {
  it("два быстрых сохранения разных полей не теряют первое", async () => {
    stubApi(20);
    render(
      <EditsProvider>
        <Probe />
      </EditsProvider>,
    );
    await waitFor(() => expect(screen.getByText("auth")).toBeInTheDocument());
    await waitFor(() => expect(api).not.toBeNull());

    await act(async () => {
      const first = api!.saveText("k", "title", "Заголовок");
      const second = api!.saveText("k", "sub", "Подзаголовок");
      await Promise.all([first, second]);
    });

    expect(putBodies).toHaveLength(2);
    // второе тело обязано содержать оба поля — иначе первая правка стирается на сервере
    expect(putBodies[1]).toMatchObject({ title: "Заголовок", sub: "Подзаголовок" });
    // и оба поля остались в состоянии
    expect(api!.dayTexts.k).toMatchObject({ title: "Заголовок", sub: "Подзаголовок" });
  });

  it("пустое значение удаляет поле, а не пишет пустую строку", async () => {
    stubApi();
    render(
      <EditsProvider>
        <Probe />
      </EditsProvider>,
    );
    await waitFor(() => expect(api).not.toBeNull());

    await act(async () => {
      await api!.saveText("k", "title", "Черновик");
    });
    await act(async () => {
      await api!.saveText("k", "title", "   ");
    });

    expect(putBodies[0]).toEqual({ title: "Черновик" });
    expect(putBodies[1]).toEqual({});
    expect(api!.dayTexts.k ?? {}).toEqual({});
  });

  it("CRLF нормализуется в LF и края обрезаются", async () => {
    stubApi();
    render(
      <EditsProvider>
        <Probe />
      </EditsProvider>,
    );
    await waitFor(() => expect(api).not.toBeNull());

    await act(async () => {
      await api!.saveText("k", "sub", "  строка один\r\nстрока два  ");
    });

    expect(putBodies[0]).toEqual({ sub: "строка один\nстрока два" });
  });
});
