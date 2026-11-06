import { cleanup, render, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, setAuth } from "../../edits/auth";
import { EditsProvider } from "../../edits/EditsContext";
import { GuideSection } from "./GuideSection";

function json(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function stubApi() {
  const calls: Array<{ url: string; method: string; body?: unknown }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });

    if (method === "GET" && url.endsWith("/api/day-notes")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/stop-notes")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/day-texts")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/guide-tags")) return json({ tags: [] });
    if (method === "PUT" && url.includes("/api/guide-tags/")) {
      return json({ tag: { tag_key: "sight|hk|victoria-peak", tag: body.tag } });
    }
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return { calls };
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

describe("GuideSection: смена тега", () => {
  it("переключение на «альтернатива» уводит карточку под раскрывашку", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const { calls } = stubApi();

    render(
      <EditsProvider>
        <GuideSection id="sights" kind="sight" />
      </EditsProvider>,
    );

    const card = document.getElementById("g-victoria-peak");
    expect(card).not.toBeNull();
    expect(card?.closest("details")).toBeNull();

    const altButton = within(card as HTMLElement).getByRole("button", { name: "альтернатива" });
    await userEvent.setup().click(altButton);

    await waitFor(() => {
      expect(document.getElementById("g-victoria-peak")?.closest("details")).not.toBeNull();
    });

    const details = document.getElementById("g-victoria-peak")?.closest("details");
    expect(details?.querySelector("summary")?.textContent).toMatch(/Альтернативы · \d+/);

    const put = calls.find((c) => c.method === "PUT" && c.url.includes("/api/guide-tags/"));
    expect(put?.body).toEqual({ tag: "alt" });
    expect(put?.url).toContain(encodeURIComponent("sight|hk|victoria-peak"));
  });
});
