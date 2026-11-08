import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { VariantProvider } from "../../hooks/useVariant";
import { VariantSection } from "./VariantSection";

function renderSection() {
  return render(
    <VariantProvider>
      <VariantSection />
    </VariantProvider>,
  );
}

describe("VariantSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("показывает бейдж основного варианта и диапазон дат", () => {
    renderSection();

    const main = screen.getByRole("button", { name: /Гонконг → Фужун/ });
    expect(within(main).getByText("основной · показан сейчас")).toBeInTheDocument();
    expect(within(main).getByText("04.12–19.12")).toBeInTheDocument();
  });

  it("остальные варианты свёрнуты в строки без картинок", () => {
    const { container } = renderSection();

    const other = screen.getByText("Чэнду и Тибет").closest("details");
    expect(other).not.toBeNull();
    expect(other).not.toHaveAttribute("open");
    expect(other).toHaveTextContent("вариант");
    expect(other).toHaveTextContent("подробнее");
    expect(other?.querySelector("img")).toBeNull();

    expect(container.querySelectorAll("details")).toHaveLength(5);
  });

  it("кнопка «Показать этот маршрут» выбирает вариант и обновляет бейджи", () => {
    renderSection();

    const main = screen.getByRole("button", { name: /Гонконг → Фужун/ });
    const other = screen.getByText("Чэнду и Тибет").closest("details") as HTMLElement;
    expect(main).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(within(other).getByRole("button", { name: "Показать этот маршрут" }));

    expect(localStorage.getItem("china-trip-variant-v5")).toBe("chengdu-tibet");
    expect(within(other).getByText("показан сейчас")).toBeInTheDocument();
    expect(within(main).getByText("основной")).toBeInTheDocument();
  });
});
