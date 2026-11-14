import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Day } from "@/types";
import type { DayTarget } from "@/lib/day-targets";
import { stopSlug } from "@/lib/slug";
import { DayCard } from "./DayCard";
import type { ItineraryEditApi } from "./EditableText";

const slug = stopSlug("Пик");

const day: Day = {
  n: 1,
  date: "07.12 · пн",
  city: "hk",
  title: "Первый день",
  sub: "Прилёт",
  places: [
    {
      k: "victoria_peak",
      name: "Пик",
      tag: "sight",
      note: "<b>Смотровая</b>",
      cost: "HK$100",
    },
  ],
};

const dayTargets: DayTarget[] = [
  { key: "v|07.12", n: 1, date: "07.12", city: "hk", label: "Д1 · 07.12 · Гонконг", slugs: [slug] },
  { key: "v|08.12", n: 2, date: "08.12", city: "cq", label: "Д2 · 08.12 · Чунцин", slugs: [] },
];

function makeApi(moveStop: ItineraryEditApi["moveStop"]): ItineraryEditApi {
  return {
    token: "t",
    editing: {},
    setEditing: vi.fn(),
    saveText: vi.fn(async () => {}),
    dayNotes: {},
    stopNotes: {},
    saveDayNote: vi.fn(async () => {}),
    deleteDayNote: vi.fn(async () => {}),
    saveStopNote: vi.fn(async () => {}),
    resetStopNote: vi.fn(async () => {}),
    moveStop,
  };
}

describe("DayCard: перенос остановки в другой день", () => {
  it("зовёт moveStop с исходным и целевым днём и данным slug", async () => {
    const user = userEvent.setup();
    const moveStop = vi.fn(async () => ({ ok: true }));
    render(
      <DayCard
        day={day}
        dayKey="v|07.12"
        texts={{}}
        api={makeApi(moveStop)}
        open
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
        dayTargets={dayTargets}
      />,
    );

    await user.click(screen.getByRole("button", { name: "перенести в другой день" }));
    await user.click(screen.getByRole("button", { name: "день Д2 · 08.12 · Чунцин" }));

    await waitFor(() =>
      expect(moveStop).toHaveBeenCalledWith({
        fromKey: "v|07.12",
        toKey: "v|08.12",
        slug,
        hideInSource: true,
        added: {
          s: slug,
          n: "Пик",
          t: "sight",
          c: "HK$100",
          d: "Смотровая",
          g: undefined,
          k: "victoria_peak",
        },
      }),
    );
  });

  it("не показывает кнопку переноса у группы вариантов", () => {
    render(
      <DayCard
        day={{
          ...day,
          places: [
            {
              k: "peak",
              title: "Смотровая: варианты",
              picks: [{ name: "Sky Terrace", cost: "HK$75" }],
            },
          ],
        }}
        dayKey="v|07.12"
        texts={{}}
        api={makeApi(vi.fn(async () => ({ ok: true })))}
        open
        onToggle={vi.fn()}
        onFocusDay={vi.fn()}
        dayTargets={dayTargets}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "перенести в другой день" }),
    ).not.toBeInTheDocument();
  });
});
