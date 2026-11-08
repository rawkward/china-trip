import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Day, Stop } from "@/types";
import type { ItineraryEditApi } from "./EditableText";
import { StopRow } from "./StopRow";

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
  title: "День",
  sub: "",
  places: [],
};

function renderStop(
  stop: Stop,
  api = makeApi(),
  onDelete = vi.fn(),
  texts: Record<string, string> = {},
) {
  return render(
    <ul>
      <StopRow
        day={day}
        dayKey="hk|07.12"
        stop={stop}
        texts={texts}
        api={api}
        index={0}
        total={1}
        mapNum={null}
        onMove={vi.fn()}
        onDelete={onDelete}
      />
    </ul>,
  );
}

describe("StopRow: время", () => {
  it("карандаш у времени открывает редактор поля времени", () => {
    const api = makeApi();
    renderStop({ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak", _time: "16:30" }, api);

    const row = screen.getByRole("listitem");
    fireEvent.click(within(row).getAllByRole("button", { name: "править время" })[0]);
    expect(api.setEditing).toHaveBeenCalledWith({ time: "stop:peak:time" });
  });

  it("редактор времени сохраняет значение через saveText", () => {
    const api = makeApi({ editing: { time: "stop:peak:time" } });
    renderStop({ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak", _time: "16:30" }, api);

    const input = screen.getByLabelText("Время остановки");
    fireEvent.change(input, { target: { value: "17:00" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "stop:peak:time", "17:00");
  });

  it("добавить время у остановки без времени тоже открывает поле", () => {
    const api = makeApi();
    renderStop({ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak" }, api);

    fireEvent.click(screen.getByRole("button", { name: "добавить время" }));
    expect(api.setEditing).toHaveBeenCalledWith({ time: "stop:peak:time" });
  });
});

describe("StopRow: замена на карточку справочника", () => {
  it("кнопка «заменить» открывает список карточек города и типа", () => {
    const api = makeApi();
    renderStop({ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak" }, api);

    fireEvent.click(screen.getByRole("button", { name: "заменить на карточку из справочника" }));
    expect(api.setEditing).toHaveBeenCalledWith({ ref: "ref:peak" });
  });

  it("выбор карточки сохраняет её ключ, а «оставить как есть» — пустую строку", () => {
    const api = makeApi({ editing: { ref: "ref:peak" } });
    renderStop({ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak" }, api);

    fireEvent.click(screen.getByRole("button", { name: /Victoria Peak/ }));
    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "ref:peak", "sight|hk|victoria-peak");
    expect(api.setEditing).toHaveBeenCalledWith({ ref: undefined });

    fireEvent.click(screen.getByRole("button", { name: "оставить как есть" }));
    expect(api.saveText).toHaveBeenCalledWith("hk|07.12", "ref:peak", "");
  });

  it("для города без подходящих карточек пишет, что карточек нет", () => {
    const api = makeApi({ editing: { ref: "ref:peak" } });
    render(
      <ul>
        <StopRow
          day={{ ...day, city: "zzz" }}
          dayKey="zzz|07.12"
          stop={{ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak" }}
          texts={{}}
          api={api}
          index={0}
          total={1}
          mapNum={null}
          onMove={vi.fn()}
          onDelete={vi.fn()}
        />
      </ul>,
    );

    expect(screen.getByText("в этом городе карточек нет")).toBeInTheDocument();
  });
});

describe("StopRow: группа вариантов", () => {
  it("рисует карусель и заголовок группы, а не обычное имя", () => {
    const api = makeApi();
    renderStop(
      {
        k: "lunch",
        title: "Обед в Централе",
        tag: "food",
        _slug: "lunch",
        picks: [
          { name: "Трамвай на Пик", note: "вид", cost: "HK$100" },
          { name: "Забегаловка", cost: "HK$40" },
        ],
      },
      api,
    );

    expect(screen.getByText("Обед в Централе")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "следующий вариант" })).toBeInTheDocument();
  });

  it("после замены на карточку справочника карусели нет, видна пометка карточки", () => {
    const api = makeApi();
    renderStop(
      {
        k: "lunch",
        name: "Victoria Peak",
        tag: "sight",
        _slug: "lunch",
        _name: "Victoria Peak",
        note: "Вид на город",
        picks: [],
      },
      api,
      vi.fn(),
      { "ref:lunch": "sight|hk|victoria-peak" },
    );

    expect(screen.queryByRole("button", { name: "следующий вариант" })).not.toBeInTheDocument();
    expect(screen.getByText("Victoria Peak")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "карточка справочника" })).toHaveAttribute(
      "href",
      "#g-victoria-peak",
    );
  });
});

describe("StopRow: удаление из маршрута", () => {
  it("кнопка «убрать из маршрута» вызывает onDelete со slug остановки", () => {
    const onDelete = vi.fn();
    renderStop({ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak" }, makeApi(), onDelete);

    fireEvent.click(screen.getByRole("button", { name: "убрать из маршрута" }));
    expect(onDelete).toHaveBeenCalledWith("peak");
  });

  it("без токена кнопки удаления нет", () => {
    renderStop({ k: "peak", name: "Трамвай на Пик", tag: "sight", _slug: "peak" }, makeApi({ token: null }));

    expect(screen.queryByRole("button", { name: "убрать из маршрута" })).not.toBeInTheDocument();
  });

  it("у группы вариантов тоже есть кнопка удаления", () => {
    const onDelete = vi.fn();
    renderStop(
      {
        k: "lunch",
        title: "Обед в Централе",
        tag: "food",
        _slug: "lunch",
        picks: [
          { name: "Трамвай на Пик", cost: "HK$100" },
          { name: "Забегаловка", cost: "HK$40" },
        ],
      },
      makeApi(),
      onDelete,
    );

    fireEvent.click(screen.getByRole("button", { name: "убрать из маршрута" }));
    expect(onDelete).toHaveBeenCalledWith("lunch");
  });
});
