import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Pick } from "@/types";
import type { ItineraryEditApi } from "./EditableText";
import { PickCarousel } from "./PickCarousel";
import { StopRow } from "./StopRow";

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

const picks: Pick[] = [
  { name: "Трамвай на Пик", note: "К 16:30 — закат", cost: "HK$116", rec: true },
  { name: "Обычная забегаловка", note: "Без вида", cost: "HK$40" },
];

describe("PickCarousel", () => {
  it("листает варианты стрелками, показывает счётчик и бейдж рекомендации", async () => {
    const user = userEvent.setup();
    render(
      <PickCarousel
        dayKey="hk|06.12"
        groupSlug="grp"
        picks={picks}
        texts={{}}
        api={makeApi()}
      />,
    );

    expect(screen.getByText("Трамвай на Пик")).toBeInTheDocument();
    expect(screen.getByText("рекомендуем")).toBeInTheDocument();
    expect(screen.getAllByText("1 / 2").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "следующий вариант" }));
    expect(screen.getByText("Обычная забегаловка")).toBeInTheDocument();
    expect(screen.getByText("альтернатива")).toBeInTheDocument();
    expect(screen.getAllByText("2 / 2").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "предыдущий вариант" }));
    expect(screen.getByText("Трамвай на Пик")).toBeInTheDocument();
    expect(screen.getByText("рекомендуем")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "вариант 2" }));
    expect(screen.getByText("Обычная забегаловка")).toBeInTheDocument();
  });

  it("показывает ссылку в справочник только когда guideIdFor её находит", async () => {
    const user = userEvent.setup();
    render(
      <PickCarousel
        dayKey="hk|06.12"
        groupSlug="grp"
        picks={picks}
        texts={{}}
        api={makeApi()}
      />,
    );

    const link = screen.getByRole("link", { name: "в справочнике" });
    expect(link).toHaveAttribute("href", "#g-victoria-peak");

    await user.click(screen.getByRole("button", { name: "следующий вариант" }));
    expect(screen.queryByRole("link", { name: "в справочнике" })).not.toBeInTheDocument();
  });

  it("не теряет выбранный вариант после правки текста", async () => {
    const user = userEvent.setup();
    const api = makeApi({ token: "t", editing: {} });
    const { rerender } = render(
      <PickCarousel
        dayKey="hk|06.12"
        groupSlug="grp"
        picks={picks}
        texts={{}}
        api={api}
      />,
    );

    await user.click(screen.getByRole("button", { name: "следующий вариант" }));
    expect(screen.getByText("Обычная забегаловка")).toBeInTheDocument();

    rerender(
      <PickCarousel
        dayKey="hk|06.12"
        groupSlug="grp"
        picks={picks}
        texts={{ "pick:grp:1:name": "Обычная забегаловка" }}
        api={{ ...api, editing: { text: "pick:grp:1:cost" } }}
      />,
    );

    expect(screen.getAllByText("2 / 2").length).toBeGreaterThan(0);
  });
});

describe("StopRow guide link", () => {
  it("ставит ссылку для известного названия и не ставит для неизвестного", () => {
    const api = makeApi();
    const day = { city: "hk", n: 1, date: "06.12 · вс", title: "День", sub: "" };
    const { rerender } = render(
      <StopRow
        day={{ ...day, places: [] }}
        dayKey="hk|06.12"
        stop={{ k: "peak", name: "Трамвай на Пик", tag: "sight" }}
        texts={{}}
        api={api}
        index={0}
        total={1}
        mapNum={null}
        onMove={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: "в справочнике" })).toHaveAttribute(
      "href",
      "#g-victoria-peak",
    );

    rerender(
      <StopRow
        day={{ ...day, places: [] }}
        dayKey="hk|06.12"
        stop={{ k: "plain", name: "Просто остановка", tag: "sight" }}
        texts={{}}
        api={api}
        index={0}
        total={1}
        mapNum={null}
        onMove={vi.fn()}
      />,
    );
    expect(screen.queryByRole("link", { name: "в справочнике" })).not.toBeInTheDocument();
  });
});
