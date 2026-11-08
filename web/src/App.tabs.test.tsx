import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

function stubApi() {
  const json = (body: unknown) =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

  vi.stubGlobal(
    "fetch",
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/day-notes")) return json({ notes: [] });
      if (url.includes("/api/stop-notes")) return json({ notes: [] });
      if (url.includes("/api/day-texts")) return json({ notes: [] });
      if (url.includes("/api/guide-tags")) return json({ tags: [] });
      return json({});
    }),
  );
}

function setHash(hash: string) {
  window.history.replaceState(null, "", "/" + hash);
}

beforeEach(() => {
  localStorage.clear();
  setHash("");
  stubApi();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setHash("");
});

describe("роутер вкладок", () => {
  it("по старому #sights открывает «Справочник» и нормализует адрес", async () => {
    setHash("#sights");

    render(<App />);

    expect(await screen.findByText("Достопримечательности по городам")).toBeInTheDocument();
    expect(document.getElementById("sights")).not.toBeNull();
    expect(document.getElementById("itinerary")).toBeNull();

    await waitFor(() => expect(window.location.hash).toBe("#/guide/sights"));
  });

  it("по #budget открывает бюджет", async () => {
    setHash("#budget");

    render(<App />);

    expect(await screen.findByText("Раздел закрыт паролем")).toBeInTheDocument();
    expect(document.getElementById("budget")).not.toBeNull();
    expect(document.getElementById("itinerary")).toBeNull();
  });

  it("меняет вкладку по hashchange", async () => {
    setHash("#/route");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Поездка в Китай вдвоём" })).toBeInTheDocument();

    act(() => {
      window.location.hash = "#/budget";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(await screen.findByText("Раздел закрыт паролем")).toBeInTheDocument();
    expect(document.getElementById("variants")).toBeNull();
  });
});
