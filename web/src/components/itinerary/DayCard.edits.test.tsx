import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Day } from "@/types";
import { DayCard } from "./DayCard";
import type { ItineraryEditApi } from "./EditableText";

function makeApi(overrides: Partial<ItineraryEditApi> = {}): ItineraryEditApi {
  return {
    token: "token",
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
    { k: "a", name: "Заселение", tag: "hotel", _slug: "a" },
    { k: "b", name: "Трамвай на Пик", tag: "sight", _slug: "b" },
    { k: "c", name: "Ужин", tag: "food", _slug: "c" },
  ],
};

function renderCard(props: Partial<Parameters<typeof DayCard>[0]> = {}) {
  return render(
    <DayCard
      day={day}
      dayKey="hk|07.12"
      texts={{}}
      api={makeApi()}
      open
      onToggle={vi.fn()}
      onFocusDay={vi.fn()}
      {...props}
    />,
  );
}

describe("DayCard: правки заголовка", () => {
  it("карандаш открывает редактор нужного поля", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(screen.getByRole("button", { name: "править заголовок дня" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: "title" });

    fireEvent.click(screen.getByRole("button", { name: "править подзаголовок дня" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: "sub" });
  });

  it("редактор заголовка сохраняет введённый текст через saveText", () => {
    const api = makeApi({ editing: { text: "title" } });
    renderCard({ api, texts: {} });

    const input = screen.getByLabelText("Заголовок дня");
    fireEvent.change(input, { target: { value: "Новый заголовок" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "title", "Новый заголовок");
  });

  it("у правленого заголовка есть кнопка сброса, она пишет пустую строку", () => {
    const api = makeApi({ editing: { text: "title" } });
    renderCard({ api, texts: { title: "Правка" } });

    fireEvent.click(screen.getByRole("button", { name: "Сбросить" }));
    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "title", "");
  });

  it("Отмена закрывает редактор, не сохраняя", () => {
    const api = makeApi({ editing: { text: "sub" } });
    renderCard({ api });

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: undefined });
    expect(api.saveText).not.toHaveBeenCalled();
  });
});

describe("DayCard: перестановка остановок", () => {
  it("кнопка «ниже» отправляет правильный порядок slug'ов", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(within(screen.getByRole("region", { name: "День 1" })).getAllByRole("button", { name: "ниже" })[0]);

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "order", "b,a,c");
  });

  it("кнопка «выше» на второй остановке возвращает исходный порядок", () => {
    const api = makeApi();
    renderCard({ api });

    fireEvent.click(within(screen.getByRole("region", { name: "День 1" })).getAllByRole("button", { name: "выше" })[1]);

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "order", "b,a,c");
  });

  it("крайние кнопки перестановки заблокированы", () => {
    renderCard();
    const region = screen.getByRole("region", { name: "День 1" });
    const ups = within(region).getAllByRole("button", { name: "выше" });
    const downs = within(region).getAllByRole("button", { name: "ниже" });
    expect(ups[0]).toBeDisabled();
    expect(downs[downs.length - 1]).toBeDisabled();
  });
});

describe("DayCard: пустой день", () => {
  it("день без остановок рендерится и не падает", () => {
    renderCard({ day: { ...day, places: [] } });

    expect(screen.getByRole("region", { name: "День 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Показать на карте/ })).toBeInTheDocument();
    expect(screen.getByText((_content, element) => element?.textContent === "0 остановок")).toBeInTheDocument();
  });
});
