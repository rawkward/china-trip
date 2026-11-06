import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Day } from "@/types";
import { MapLegend, MapTools } from "./MapTools";
import type { MapToolsProps } from "./MapTools";

const days: Day[] = [
  { n: 1, date: "04.12 · пт", city: "hk", title: "Гонконг", sub: "", places: [] },
  { n: 2, date: "05.12 · сб", city: "cq", title: "Чунцин", sub: "", places: [] },
  { n: 3, date: "06.12 · вс", city: "cq", title: "Чунцин", sub: "", places: [] },
];

const kinds = [
  { k: "hotel" as const, label: "Отели" },
  { k: "food" as const, label: "Заведения" },
];

const base: MapToolsProps = {
  mode: "all",
  day: 1,
  days,
  kind: "all",
  city: "all",
  kinds,
  cities: ["hk", "cq"],
  tileLabel: "Google",
  dayUrl: "https://www.google.com/maps",
  onModeChange: () => {},
  onDayChange: () => {},
  onKindChange: () => {},
  onCityChange: () => {},
  onReset: () => {},
  onNextTile: () => {},
};

function renderTools(overrides: Partial<MapToolsProps> = {}) {
  return render(<MapTools {...base} {...overrides} />);
}

describe("MapTools", () => {
  it("переключает режим и помечает активный чип через aria-pressed", () => {
    const onModeChange = vi.fn();
    const { rerender } = renderTools({ onModeChange });

    const allChip = screen.getByRole("button", { name: "Все точки" });
    expect(allChip).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "По дням" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "По дням" }));
    expect(onModeChange).toHaveBeenCalledWith("day");

    rerender(<MapTools {...base} mode="day" onModeChange={onModeChange} />);
    expect(screen.getByRole("button", { name: "По дням" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Все точки" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("селект дня отдаёт номер дня", () => {
    const onDayChange = vi.fn();
    renderTools({ mode: "day", onDayChange });

    const select = screen.getByLabelText("День маршрута");
    expect(select).toHaveValue("1");
    fireEvent.change(select, { target: { value: "3" } });
    expect(onDayChange).toHaveBeenCalledWith(3);
  });

  it("показывает выбранную подложку и переключает её кнопкой", () => {
    const onNextTile = vi.fn();
    renderTools({ tileLabel: "Яндекс", onNextTile });

    expect(screen.getByText("Подложка: Яндекс")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Другая карта" }));
    expect(onNextTile).toHaveBeenCalledTimes(1);
  });

  it("фильтры по типу и городу вызывают обработчики", () => {
    const onKindChange = vi.fn();
    const onCityChange = vi.fn();
    renderTools({ onKindChange, onCityChange });

    fireEvent.click(screen.getByRole("button", { name: "Отели" }));
    expect(onKindChange).toHaveBeenCalledWith("hotel");

    fireEvent.click(screen.getByRole("button", { name: "Чунцин" }));
    expect(onCityChange).toHaveBeenCalledWith("cq");
  });

  it("сброс и режим дня: ссылка на маршрут и подпись под картой", () => {
    const onReset = vi.fn();
    renderTools({ mode: "day", day: 2, onReset });

    expect(
      screen.getByRole("link", { name: /Маршрут дня в Google Maps/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Точки дня пронумерованы по порядку плана/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Сброс" }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });
});

describe("MapLegend", () => {
  it("показывает города в переданном порядке", () => {
    const { container } = render(<MapLegend cities={["hk", "cq"]} />);
    expect(container.textContent).toContain("Гонконг");
    expect(container.textContent).toContain("Чунцин");
    expect(container.textContent?.indexOf("Гонконг")).toBeLessThan(
      container.textContent?.indexOf("Чунцин") ?? -1,
    );

    const dots = container.querySelectorAll<HTMLElement>("span[aria-hidden='true']");
    expect(dots).toHaveLength(2);
    expect(dots[0].style.background).toBeTruthy();
  });

  it("без городов ничего не рисует", () => {
    const { container } = render(<MapLegend cities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
