import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DATES, VARIANTS } from "@/data";
import { EditsProvider } from "@/edits/EditsContext";
import { buildDays, noteKey } from "@/lib/days";
import { VariantProvider } from "@/hooks/useVariant";
import { ItinerarySection } from "./ItinerarySection";

function mockApi(dayKey: string, title: string) {
  const json = (body: unknown) =>
    Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);

  const fetchMock = vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/day-notes")) return json({ notes: [] });
    if (url.includes("/api/stop-notes")) return json({ notes: [] });
    if (url.includes("/api/day-texts")) {
      return json({
        notes: [{ day_key: dayKey, texts: { title }, updated_at: 1 }],
      });
    }
    if (url.includes("/api/guide-tags")) return json({ tags: [] });
    return json({});
  });

  vi.stubGlobal("fetch", fetchMock);
}

describe("ItinerarySection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("накладывает dayTexts на день, пришедший из useVariant", async () => {
    const main = VARIANTS.find((v) => v.main) ?? VARIANTS[0];
    const first = buildDays(main, DATES)[0];
    mockApi(noteKey(main.id, first), "ПОДМЕНЁННЫЙ ЗАГОЛОВОК");

    render(
      <VariantProvider>
        <EditsProvider>
          <ItinerarySection />
        </EditsProvider>
      </VariantProvider>,
    );

    expect(await screen.findByText("ПОДМЕНЁННЫЙ ЗАГОЛОВОК")).toBeInTheDocument();
    expect(screen.getByText(/всего \d+ ноч/)).toBeInTheDocument();

    const head = document.querySelector('button[aria-controls="day-body-1"]') as HTMLButtonElement;
    expect(head).toHaveAttribute("aria-expanded", "false");
    await userEvent.setup().click(head);
    expect(head).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("region", { name: "День 1" })).toBeInTheDocument();
    await userEvent.setup().click(head);
    expect(head).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "День 1" })).not.toBeInTheDocument();
  });
});
