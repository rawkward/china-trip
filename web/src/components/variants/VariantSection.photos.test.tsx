import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VariantProvider } from "../../hooks/useVariant";
import { VariantSection } from "./VariantSection";

vi.mock("../../data", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../data")>();
  return {
    ...actual,
    VARIANTS: actual.VARIANTS.map((variant, index) =>
      index === 1 ? { ...variant, photo: "фото-которого-нет" } : variant,
    ),
  };
});

describe("VariantSection: вариант без фото", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("карточка без PHOTOS[key] не ломается и не рисует битую картинку", () => {
    render(
      <VariantProvider>
        <VariantSection />
      </VariantProvider>,
    );

    const broken = screen.getByRole("button", { name: /Гонконг \+ день/ });
    expect(broken.querySelector("img")).toBeNull();
    expect(broken).toHaveTextContent("Гонконг + день");

    const withPhoto = screen.getByRole("button", { name: /Гонконг → Фужун/ });
    expect(withPhoto.querySelector("img")).not.toBeNull();
  });
});
