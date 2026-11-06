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

  it("переключает вариант по клику и обновляет бейджи", () => {
    renderSection();

    const main = screen.getByRole("button", { name: /Гонконг → Фужун/ });
    const other = screen.getByRole("button", { name: /Чэнду и Тибет/ });
    expect(main).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(other);

    expect(localStorage.getItem("china-trip-variant-v5")).toBe("chengdu-tibet");
    expect(other).toHaveAttribute("aria-pressed", "true");
    expect(main).toHaveAttribute("aria-pressed", "false");
    expect(within(other).getByText("показан сейчас")).toBeInTheDocument();
    expect(within(main).getByText("основной")).toBeInTheDocument();
  });

  it("выбирает вариант с клавиатуры (Enter и Space)", () => {
    renderSection();

    const byEnter = screen.getByRole("button", { name: /Гонконг, Макао, Гуанчжоу/ });
    fireEvent.keyDown(byEnter, { key: "Enter" });
    expect(localStorage.getItem("china-trip-variant-v5")).toBe("hk-macau");

    const bySpace = screen.getByRole("button", { name: /Гонконг, Макао и Хайнань/ });
    fireEvent.keyDown(bySpace, { key: " " });
    expect(localStorage.getItem("china-trip-variant-v5")).toBe("sanya");
  });
});
