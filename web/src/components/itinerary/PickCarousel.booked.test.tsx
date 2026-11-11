import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Pick } from "@/types";
import type { ItineraryEditApi } from "./EditableText";
import { PickCarousel } from "./PickCarousel";

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
  { name: "Первый отель", note: "Ближе к метро", cost: "4 020 ₽" },
  { name: "Забронированный отель", note: "Наш выбор", cost: "15 585 ₽", rec: true },
  { name: "Третий отель", note: "С видом на реку", cost: "3 908 ₽" },
];

describe("PickCarousel layout=booked", () => {
  it("показывает рекомендованный отель, а остальные прячет под раскрывашку", () => {
    render(
      <PickCarousel
        dayKey="cq|14.12"
        groupSlug="grp"
        picks={picks}
        texts={{}}
        api={makeApi()}
        layout="booked"
      />,
    );

    const main = screen.getByText("Забронированный отель");
    expect(main.closest("details")).toBeNull();
    expect(screen.getByText("наш выбор")).toBeInTheDocument();

    const summary = screen.getByText(/остальные варианты \(2\)/);
    const details = summary.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    for (const name of ["Первый отель", "Третий отель"]) {
      const item = screen.getByText(name);
      expect(item.closest("details")).toBe(details);
    }
  });
});
