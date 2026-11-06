import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Pick } from "@/types";
import type { ItineraryEditApi } from "./EditableText";
import { PickCarousel } from "./PickCarousel";

function makeApi(): ItineraryEditApi {
  return {
    token: "token",
    editing: {},
    setEditing: vi.fn(),
    saveText: vi.fn(async () => {}),
    dayNotes: {},
    stopNotes: {},
    saveDayNote: vi.fn(async () => {}),
    deleteDayNote: vi.fn(async () => {}),
    saveStopNote: vi.fn(async () => {}),
    resetStopNote: vi.fn(async () => {}),
  };
}

const single: Pick[] = [{ name: "Единственный вариант", note: "без альтернатив", cost: "HK$100" }];

describe("PickCarousel: один вариант", () => {
  it("стрелки на месте, но листать некуда — счётчик 1 / 1", () => {
    render(
      <PickCarousel
        dayKey="hk|06.12"
        groupSlug="grp"
        picks={single}
        texts={{}}
        api={makeApi()}
      />,
    );

    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByText("рекомендуем")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "следующий вариант" }));
    fireEvent.click(screen.getByRole("button", { name: "предыдущий вариант" }));

    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByText("Единственный вариант")).toBeInTheDocument();
  });

  it("пустой список вариантов не рисует ничего", () => {
    const { container } = render(
      <PickCarousel
        dayKey="hk|06.12"
        groupSlug="grp"
        picks={[]}
        texts={{}}
        api={makeApi()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
