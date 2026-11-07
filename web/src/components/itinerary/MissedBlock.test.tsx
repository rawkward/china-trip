import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MISSED } from "@/content/missed";
import { MissedBlock } from "./MissedBlock";

describe("MissedBlock", () => {
  it("перечисляет выпавшие места ссылками в справочник", () => {
    render(<MissedBlock />);
    expect(screen.getByText("Можно посмотреть ещё")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(MISSED.length);
    expect(screen.getByRole("link", { name: /Тяньмэньшань/ })).toHaveAttribute(
      "href",
      "#g-tianmen-mountain",
    );
  });
});
