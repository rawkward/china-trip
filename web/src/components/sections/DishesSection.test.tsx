import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CITIES } from "@/data";
import { DISHES } from "@/content/dishes";
import { DishesSection } from "./DishesSection";

describe("DishesSection", () => {
  it("рендерит все пять городов", () => {
    render(<DishesSection />);

    expect(DISHES).toHaveLength(5);
    for (const cityDishes of DISHES) {
      const block = document.getElementById("dish-" + cityDishes.city);
      expect(block).not.toBeNull();
      expect(
        within(block as HTMLElement).getByRole("heading", {
          name: CITIES[cityDishes.city].label,
        }),
      ).toBeInTheDocument();
    }
  });

  it("показывает блюда Фужуна под своим якорем", () => {
    render(<DishesSection />);

    const fr = document.getElementById("dish-fr");
    expect(fr).not.toBeNull();
    expect(within(fr as HTMLElement).getByText("米豆腐")).toBeInTheDocument();
    expect(within(fr as HTMLElement).getByText("Рисовый тофу")).toBeInTheDocument();
    expect(within(fr as HTMLElement).getByText("7 блюд")).toBeInTheDocument();
  });
});
