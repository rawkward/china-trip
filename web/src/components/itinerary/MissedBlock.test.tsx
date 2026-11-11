import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CITIES, DATES, GUIDE_ITEMS, VARIANTS } from "@/data";
import { clearAuth, setAuth } from "@/edits/auth";
import { EditsProvider } from "@/edits/EditsContext";
import { VariantProvider } from "@/hooks/useVariant";
import { buildDays, noteKey } from "@/lib/days";
import { tagOf } from "@/lib/guide";
import { stopSlug } from "@/lib/slug";
import { STORAGE_KEYS } from "@/lib/storage";
import { MissedBlock } from "./MissedBlock";
import { slugOfStop } from "./stopMeta";

interface Call {
  url: string;
  method: string;
  body: unknown;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubApi(texts: unknown[] = []) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });

    if (method === "GET" && url.endsWith("/api/day-notes")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/stop-notes")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/day-texts")) return json({ notes: texts });
    if (method === "GET" && url.endsWith("/api/guide-tags")) return json({ tags: [] });
    if (method === "PUT" && url.includes("/api/day-texts/")) {
      const values = (body as { texts?: Record<string, string> })?.texts ?? {};
      const dayKey = decodeURIComponent(url.split("/api/day-texts/")[1] ?? "");
      return json({
        note: Object.keys(values).length
          ? { day_key: dayKey, texts: values, updated_at: 12 }
          : null,
      });
    }
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

const MAIN = VARIANTS.find((v) => v.main) ?? VARIANTS[0];
const DAYS = buildDays(MAIN, DATES);

const CITY_DAY =
  DAYS.find((day) => day.places.length > 0 && DAYS.filter((d) => d.city === day.city).length > 1) ??
  DAYS.find((day) => day.places.length > 0)!;
const CITY_DAYS = DAYS.filter((d) => d.city === CITY_DAY.city);
const SOURCE_KEY = noteKey(MAIN.id, CITY_DAY);
const MOVE_STOP = CITY_DAY.places[0];
const MOVE_SLUG = slugOfStop(MOVE_STOP);
const MOVE_NAME = MOVE_STOP.title ?? MOVE_STOP.name ?? "";

const MULTI_VARIANT = VARIANTS.find((variant) => variant.id === "hk-plus-day") ?? MAIN;
const MULTI_DAYS = buildDays(MULTI_VARIANT, DATES);

function findSharedStop(days: typeof MULTI_DAYS) {
  for (const day of days) {
    for (const stop of day.places) {
      const slug = slugOfStop(stop);
      const other = days.find(
        (d) => d !== day && d.city === day.city && d.places.some((p) => slugOfStop(p) === slug),
      );
      if (other) return { day, other, slug, name: stop.title ?? stop.name ?? "" };
    }
  }
  return null;
}

const SHARED = findSharedStop(MULTI_DAYS);

function renderMissed() {
  return render(
    <VariantProvider>
      <EditsProvider>
        <MissedBlock />
      </EditsProvider>
    </VariantProvider>,
  );
}

function openDetails(container: HTMLElement) {
  const details = container.querySelector("#missed");
  expect(details).not.toBeNull();
  details!.setAttribute("open", "");
  return details as HTMLElement;
}

function inRoute(slug: string) {
  return DAYS.some((day) => day.places.some((stop) => slugOfStop(stop) === slug));
}

function missedTexts() {
  return [
    {
      day_key: SOURCE_KEY,
      texts: { missed: MOVE_SLUG },
      updated_at: 1,
    },
  ];
}

function putTexts(calls: Call[], key: string) {
  return calls
    .filter(
      (call) =>
        call.method === "PUT" &&
        call.url.includes("/api/day-texts/") &&
        decodeURIComponent(call.url.split("/api/day-texts/")[1] ?? "") === key,
    )
    .map((call) => (call.body as { texts?: Record<string, string> })?.texts ?? {});
}

beforeEach(() => {
  localStorage.clear();
  clearAuth();
});

afterEach(() => {
  clearAuth();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("MissedBlock", () => {
  it("свёрнут по умолчанию и при раскрытии перечисляет все альтернативы справочника", () => {
    stubApi();
    const { container } = renderMissed();
    const expected = GUIDE_ITEMS.filter(
      (item) => tagOf(item, {}) === "alt" && !inRoute(stopSlug(item.en)),
    );

    const details = container.querySelector("#missed");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    expect(screen.getByText("Можно посмотреть ещё")).toBeInTheDocument();
    expect(within(details as HTMLElement).getByText(`· ${expected.length}`)).toBeInTheDocument();

    details!.setAttribute("open", "");

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(expected.length);
    expect(links.some((link) => /^#g-.+/.test(link.getAttribute("href") ?? ""))).toBe(true);
  });

  it("показывает перенесённые места в городе исходного дня", async () => {
    stubApi(missedTexts());
    const { container } = renderMissed();
    const details = openDetails(container);

    const section = within(details).getByRole("region", { name: CITIES[CITY_DAY.city].label });
    expect(await within(section).findByText(MOVE_NAME)).toBeInTheDocument();
    expect(within(section).getByText(`перенесено из Д${CITY_DAY.n}`)).toBeInTheDocument();
  });

  it("без токена не показывает кнопки возврата", async () => {
    stubApi(missedTexts());
    const { container } = renderMissed();
    const details = openDetails(container);

    await within(details).findByText(MOVE_NAME);
    expect(screen.queryByRole("button", { name: /вернуть .* в день/ })).not.toBeInTheDocument();
  });

  it("с токеном раскрывает чипы только дней этого города", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    stubApi(missedTexts());
    const { container } = renderMissed();
    const details = openDetails(container);

    await within(details).findByText(MOVE_NAME);
    const button = screen.getByRole("button", { name: `вернуть ${MOVE_NAME} в день` });
    fireEvent.click(button);

    const wrapper = button.parentElement as HTMLElement;
    const chips = within(wrapper)
      .getAllByRole("button")
      .filter((chip) => (chip.textContent ?? "").startsWith("Д"));
    expect(chips).toHaveLength(CITY_DAYS.length);
    expect(chips.map((chip) => chip.textContent)).toEqual(
      CITY_DAYS.map((day) => `Д${day.n} · ${day.date}`),
    );
  });

  it("клик по чипу пишет add в выбранный день и убирает запись из missed исходного дня", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const { calls } = stubApi(missedTexts());
    const { container } = renderMissed();
    const details = openDetails(container);

    await within(details).findByText(MOVE_NAME);
    const button = screen.getByRole("button", { name: `вернуть ${MOVE_NAME} в день` });
    fireEvent.click(button);

    const target = CITY_DAYS.find((day) => day.n !== CITY_DAY.n)!;
    const wrapper = button.parentElement as HTMLElement;
    fireEvent.click(within(wrapper).getByRole("button", { name: `Д${target.n} · ${target.date}` }));

    await waitFor(() => {
      const addCall = calls.find(
        (call) =>
          call.method === "PUT" &&
          call.url.includes("/api/day-texts/") &&
          typeof (call.body as { texts?: Record<string, string> })?.texts?.add === "string",
      );
      expect(addCall).toBeTruthy();
    });

    const addCall = calls.find(
      (call) =>
        call.method === "PUT" &&
        call.url.includes("/api/day-texts/") &&
        typeof (call.body as { texts?: Record<string, string> })?.texts?.add === "string",
    )!;
    expect(addCall.url).toContain(encodeURIComponent(noteKey(MAIN.id, target)));
    const added = JSON.parse((addCall.body as { texts: Record<string, string> }).texts.add);
    expect(added).toEqual([
      expect.objectContaining({ s: MOVE_SLUG, n: MOVE_NAME }),
    ]);

    await waitFor(() => {
      const missedCall = calls.find(
        (call) =>
          call.method === "PUT" &&
          call.url.includes("/api/day-texts/") &&
          encodeURIComponent(SOURCE_KEY) === call.url.split("/api/day-texts/")[1] &&
          !("missed" in ((call.body as { texts?: Record<string, string> })?.texts ?? {})),
      );
      expect(missedCall).toBeTruthy();
    });
  });

  it("возврат в исходный день снимает hide и missed, не добавляя add", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const { calls } = stubApi([
      {
        day_key: SOURCE_KEY,
        texts: { hide: MOVE_SLUG, missed: MOVE_SLUG },
        updated_at: 1,
      },
    ]);
    const { container } = renderMissed();
    const details = openDetails(container);

    await within(details).findByText(MOVE_NAME);
    const button = screen.getByRole("button", { name: `вернуть ${MOVE_NAME} в день` });
    fireEvent.click(button);

    const wrapper = button.parentElement as HTMLElement;
    fireEvent.click(
      within(wrapper).getByRole("button", { name: `Д${CITY_DAY.n} · ${CITY_DAY.date}` }),
    );

    await waitFor(() => expect(putTexts(calls, SOURCE_KEY)).toHaveLength(2));
    const saved = putTexts(calls, SOURCE_KEY);
    expect(saved.some((texts) => typeof texts.add === "string")).toBe(false);
    expect(saved[saved.length - 1].hide).toBeUndefined();
    expect(saved[saved.length - 1].missed).toBeUndefined();
  });

  it("возврат в один из исходных дней чистит missed у всех, а hide — только у выбранного", async () => {
    expect(SHARED).not.toBeNull();
    const shared = SHARED!;
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    localStorage.setItem(STORAGE_KEYS.variant, MULTI_VARIANT.id);
    const targetKey = noteKey(MULTI_VARIANT.id, shared.day);
    const otherKey = noteKey(MULTI_VARIANT.id, shared.other);
    const { calls } = stubApi([
      {
        day_key: targetKey,
        texts: { hide: shared.slug, missed: shared.slug },
        updated_at: 1,
      },
      {
        day_key: otherKey,
        texts: { hide: shared.slug, missed: shared.slug },
        updated_at: 2,
      },
    ]);
    const { container } = renderMissed();
    const details = openDetails(container);

    await within(details).findByText(shared.name);
    const button = screen.getByRole("button", { name: `вернуть ${shared.name} в день` });
    fireEvent.click(button);

    const wrapper = button.parentElement as HTMLElement;
    fireEvent.click(
      within(wrapper).getByRole("button", { name: `Д${shared.day.n} · ${shared.day.date}` }),
    );

    await waitFor(() => expect(putTexts(calls, targetKey)).toHaveLength(2));
    await waitFor(() => expect(putTexts(calls, otherKey)).toHaveLength(1));

    const savedTarget = putTexts(calls, targetKey);
    expect(savedTarget[savedTarget.length - 1].hide).toBeUndefined();
    expect(savedTarget[savedTarget.length - 1].missed).toBeUndefined();

    const savedOther = putTexts(calls, otherKey);
    expect(savedOther[savedOther.length - 1].hide).toBe(shared.slug);
    expect(savedOther[savedOther.length - 1].missed).toBeUndefined();

    expect(
      calls.some(
        (call) => typeof (call.body as { texts?: Record<string, string> })?.texts?.add === "string",
      ),
    ).toBe(false);
  });

  it("возврат в день, где остановка уже видима, ничего не сохраняет", async () => {
    setAuth("token", Math.floor(Date.now() / 1000) + 3600);
    const { calls } = stubApi(missedTexts());
    const { container } = renderMissed();
    const details = openDetails(container);

    await within(details).findByText(MOVE_NAME);
    const button = screen.getByRole("button", { name: `вернуть ${MOVE_NAME} в день` });
    fireEvent.click(button);

    const wrapper = button.parentElement as HTMLElement;
    const chip = within(wrapper).getByRole("button", {
      name: `Д${CITY_DAY.n} · ${CITY_DAY.date}`,
    });
    fireEvent.click(chip);

    await waitFor(() => expect(chip).not.toBeInTheDocument());
    expect(calls.some((call) => call.method === "PUT")).toBe(false);
  });

  it("не показывает запись, которую уже добавили в маршрут через add", async () => {
    stubApi([
      {
        day_key: SOURCE_KEY,
        texts: {
          missed: MOVE_SLUG,
          add: JSON.stringify([{ s: MOVE_SLUG, n: MOVE_NAME }]),
        },
        updated_at: 1,
      },
    ]);
    const { container } = renderMissed();
    const details = openDetails(container);

    await within(details).findByText("Можно посмотреть ещё");
    await waitFor(() => expect(screen.queryByText(`перенесено из Д${CITY_DAY.n}`)).not.toBeInTheDocument());
  });
});
