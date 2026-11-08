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

describe("VariantSection: фото только у основного варианта", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("рисует картинку у основного и ни одной у остальных строк", () => {
    const { container } = render(
      <VariantProvider>
        <VariantSection />
      </VariantProvider>,
    );

    const main = screen.getByRole("button", { name: /Гонконг → Фужун/ });
    expect(main.querySelector("img")).not.toBeNull();

    const rows = container.querySelectorAll("details");
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => expect(row.querySelector("img")).toBeNull());

    const broken = screen.getByText(/Гонконг \+ день/).closest("details");
    expect(broken).not.toBeNull();
    expect(broken?.querySelector("img")).toBeNull();
    expect(broken).toHaveTextContent("Гонконг + день");
  });
});
