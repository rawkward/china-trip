import { render, screen, waitFor, within } from "@testing-library/react";
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

function mockViewport(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query: string) =>
      ({
        matches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => false),
      }) as unknown as MediaQueryList,
  );
}

function mockScrollIntoView() {
  const spy = vi.fn();
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    value: spy,
    configurable: true,
    writable: true,
  });
  return spy;
}

function renderSection() {
  return render(
    <VariantProvider>
      <EditsProvider>
        <ItinerarySection />
      </EditsProvider>
    </VariantProvider>,
  );
}

async function openDayAndFocusMap(user: ReturnType<typeof userEvent.setup>) {
  let head: HTMLButtonElement | null = null;
  await waitFor(() => {
    head = document.querySelector<HTMLButtonElement>('button[aria-controls="day-body-1"]');
    expect(head).not.toBeNull();
  });
  await user.click(head!);

  const body = document.getElementById("day-body-1");
  expect(body).not.toBeNull();
  const showOnMap = within(body as HTMLElement).getByRole("button", { name: /Показать на карте/ });
  await user.click(showOnMap);
}

describe("ItinerarySection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (Element.prototype as unknown as Record<string, unknown>).scrollIntoView;
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

  it("показывает ссылки на списки мест без раскрытия дней", async () => {
    const main = VARIANTS.find((v) => v.main) ?? VARIANTS[0];
    const first = buildDays(main, DATES)[0];
    mockApi(noteKey(main.id, first), first.title);

    renderSection();

    const links = await screen.findAllByRole("link", { name: /Список мест на карте/ });
    expect(links).toHaveLength(4);

    const expectedHrefs = [
      "https://maps.app.goo.gl/WVb7ZLsr4ebW1hqM7",
      "https://maps.app.goo.gl/X79tTZuYo3U45ydN9",
      "https://maps.app.goo.gl/MZMv96EnFznmL6B1A",
      "https://maps.app.goo.gl/RiwcPz5Q99wdBdZKA",
    ];
    expect(links.map((link) => link.getAttribute("href")).sort()).toEqual(expectedHrefs.slice().sort());

    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    }
    expect(screen.queryByRole("region", { name: "День 1" })).not.toBeInTheDocument();
  });

  it("на узком окне кнопка «Карта» открывает карту и скроллит к ней", async () => {
    const main = VARIANTS.find((v) => v.main) ?? VARIANTS[0];
    const first = buildDays(main, DATES)[0];
    mockApi(noteKey(main.id, first), first.title);
    mockViewport(false);
    const scrollSpy = mockScrollIntoView();

    renderSection();
    const button = await screen.findByRole("button", { name: /Карта/ });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await userEvent.setup().click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1));
    expect(scrollSpy.mock.instances[0]).toBe(document.getElementById("itinerary-map"));
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("на узком окне скроллит к карте после «Показать на карте»", async () => {
    const main = VARIANTS.find((v) => v.main) ?? VARIANTS[0];
    const first = buildDays(main, DATES)[0];
    mockApi(noteKey(main.id, first), first.title);
    mockViewport(false);
    const scrollSpy = mockScrollIntoView();

    renderSection();
    await openDayAndFocusMap(userEvent.setup());

    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1));
    expect(scrollSpy.mock.instances[0]).toBe(document.getElementById("itinerary-map"));
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("клик по городу в схеме скроллит к первому дню этого города", async () => {
    const main = VARIANTS.find((v) => v.main) ?? VARIANTS[0];
    const first = buildDays(main, DATES)[0];
    mockApi(noteKey(main.id, first), first.title);
    const scrollSpy = mockScrollIntoView();

    renderSection();

    const chain = await waitFor(() => {
      const el = document.querySelector("[data-route-chain]");
      expect(el).not.toBeNull();
      return el as HTMLElement;
    });
    await userEvent.setup().click(within(chain).getByRole("button", { name: /Чжанцзяцзе/ }));

    await waitFor(() => expect(scrollSpy).toHaveBeenCalledTimes(1));
    const target = scrollSpy.mock.instances[0] as HTMLElement;
    expect(target.id).toMatch(/^city-\d+$/);
    expect(document.getElementById("dayList")?.contains(target)).toBe(true);
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  });

  it("на широком окне не скроллит к карте", async () => {
    const main = VARIANTS.find((v) => v.main) ?? VARIANTS[0];
    const first = buildDays(main, DATES)[0];
    mockApi(noteKey(main.id, first), first.title);
    mockViewport(true);
    const scrollSpy = mockScrollIntoView();

    renderSection();
    await openDayAndFocusMap(userEvent.setup());

    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
