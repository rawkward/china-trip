import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VariantProvider } from "@/hooks/useVariant";
import type { Day } from "@/types";
import { RouteMap } from "./RouteMap";

function renderMap(
  props: {
    visible?: boolean;
    focusDay?: number | null;
    onDayChange?: (n: number) => void;
    days?: Day[];
  } = {},
) {
  return render(
    <VariantProvider>
      <RouteMap
        visible={props.visible ?? true}
        focusDay={props.focusDay ?? null}
        onDayChange={props.onDayChange}
        days={props.days}
      />
    </VariantProvider>,
  );
}

describe("RouteMap", () => {
  it("focusDay включает режим дня и выставляет номер", async () => {
    renderMap({ focusDay: 3 });
    const select = await screen.findByLabelText("День маршрута");
    expect(select).toHaveValue("3");
  });

  it("селект дня сообщает о выборе наружу", async () => {
    const onDayChange = vi.fn();
    renderMap({ focusDay: 1, onDayChange });

    fireEvent.change(await screen.findByLabelText("День маршрута"), {
      target: { value: "2" },
    });
    expect(onDayChange).toHaveBeenCalledWith(2);
  });

  it("в режиме всех точек показывает фильтры и легенду", () => {
    renderMap();
    expect(screen.getByRole("button", { name: "Все точки" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Подложка: Google")).toBeInTheDocument();
  });
});

describe("RouteMap: переданные дни", () => {
  it("берёт дни из пропа days и показывает их в селекте", async () => {
    const days: Day[] = [
      { n: 1, date: "07.12 · пн", city: "hk", title: "Первый", sub: "", places: [] },
      { n: 2, date: "08.12 · вт", city: "hk", title: "Второй", sub: "", places: [] },
    ];
    renderMap({ days, focusDay: 1 });

    const select = await screen.findByLabelText("День маршрута");
    expect(select.querySelectorAll("option")).toHaveLength(2);
    expect(select).toHaveValue("1");
  });
});
