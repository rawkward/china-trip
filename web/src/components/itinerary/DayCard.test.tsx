import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GUIDE_ITEMS } from "@/data";
import { withTexts } from "@/lib/texts";
import type { Day } from "@/types";
import { DayCard } from "./DayCard";
import type { ItineraryEditApi } from "./EditableText";

function makeApi(overrides: Partial<ItineraryEditApi> = {}): ItineraryEditApi {
  return {
    token: null,
    editing: {},
    setEditing: vi.fn(),
    saveText: vi.fn(async () => {}),
    dayNotes: {},
    stopNotes: {},
    saveDayNote: vi.fn(async () => {}),
    deleteDayNote: vi.fn(async () => {}),
    saveStopNote: vi.fn(async () => {}),
    resetStopNote: vi.fn(async () => {}),
    ...overrides,
  };
}

const day: Day = {
  n: 1,
  date: "07.12 · пн",
  city: "hk",
  title: "Первый день",
  sub: "Прилёт и заселение",
  places: [
    { k: "hotel", name: "Заселение в Джордане", tag: "hotel", note: "<b>важно</b>", cost: "HK$100" },
    { k: "peak", name: "Трамвай на Пик", tag: "sight" },
  ],
};

describe("DayCard", () => {
  it("по умолчанию свёрнут и помечен aria-expanded=false", () => {
    render(
      <DayCard
        day={day}
        dayKey="hk|07.12"
        texts={{}}
        api={makeApi()}
        open={false}
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
      />,
    );

    const head = screen.getByRole("button", { name: /Д1/ });
    expect(head).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "День 1" })).not.toBeInTheDocument();
    expect(screen.queryByText("Показать на карте")).not.toBeInTheDocument();
  });

  it("показывает тело, остановки и кнопку карты в открытом состоянии", () => {
    render(
      <DayCard
        day={day}
        dayKey="hk|07.12"
        texts={{}}
        api={makeApi()}
        open
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Д1/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByRole("region", { name: "День 1" })).toBeInTheDocument();
    expect(screen.getByText("Заселение в Джордане")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Показать на карте/ })).toBeInTheDocument();
    expect(screen.getByText("важно")).toBeInTheDocument();
  });

  it("показывает подменённый через withTexts текст", () => {
    const texts = { title: "ПОДМЕНЁННЫЙ ЗАГОЛОВОК", sub: "Новый подзаголовок" };
    const patched = withTexts(day, texts, GUIDE_ITEMS);

    render(
      <DayCard
        day={patched}
        dayKey="hk|07.12"
        texts={texts}
        api={makeApi()}
        open
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
      />,
    );

    expect(screen.getByText("ПОДМЕНЁННЫЙ ЗАГОЛОВОК")).toBeInTheDocument();
    expect(screen.queryByText("Первый день")).not.toBeInTheDocument();
    expect(screen.getAllByText("правка").length).toBeGreaterThan(0);
  });

  it("рендерит заметку к дню и честную дату обновления", () => {
    const updated = new Date(2026, 10, 6, 12, 30).getTime() / 1000;
    const api = makeApi({
      dayNotes: {
        "hk|07.12": {
          day_key: "hk|07.12",
          body: "Взять зонт и наличные",
          updated_at: updated,
        },
      },
    });

    render(
      <DayCard
        day={day}
        dayKey="hk|07.12"
        texts={{}}
        api={api}
        open
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
      />,
    );

    expect(screen.getByText("Взять зонт и наличные")).toBeInTheDocument();
    expect(screen.getByText(/обновлено 06\.11, 12:30/)).toBeInTheDocument();
  });

  it("зовёт карту с номером дня", async () => {
    const user = userEvent.setup();
    const onFocusDay = vi.fn();
    render(
      <DayCard
        day={day}
        dayKey="hk|07.12"
        texts={{}}
        api={makeApi()}
        open
        onToggle={vi.fn()}
        onFocusDay={onFocusDay}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Показать на карте/ }));
    expect(onFocusDay).toHaveBeenCalledWith(1);
  });
});
