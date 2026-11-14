import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GuideItem } from "../../types";
import type { DayTargetOption } from "../ui";
import { GuideCard } from "./GuideCard";

const item: GuideItem = {
  kind: "sight",
  city: "hk",
  id: "victoria-peak",
  en: "Victoria Peak & Peak Tram",
};

const options: DayTargetOption[] = [
  { key: "v|07.12", label: "Д1 · 07.12 · Гонконг" },
  { key: "v|12.12", label: "Д5 · 12.12 · Чунцин", taken: true },
];

function renderCard(overrides: {
  token?: string | null;
  dayOptions?: DayTargetOption[];
  onAddToDay?: (key: string) => Promise<boolean> | boolean;
} = {}) {
  return render(
    <GuideCard
      item={item}
      tag="choice"
      kind="sight"
      token={"token" in overrides ? overrides.token ?? null : "t"}
      onTag={vi.fn()}
      dayOptions={overrides.dayOptions ?? options}
      onAddToDay={overrides.onAddToDay ?? vi.fn()}
    />,
  );
}

describe("GuideCard: добавление в день", () => {
  it("без токена кнопки «в день» нет", () => {
    renderCard({ token: null });
    expect(
      screen.queryByRole("button", { name: "добавить «Victoria Peak & Peak Tram» в день" }),
    ).not.toBeInTheDocument();
  });

  it("с токеном и списком дней показывает кнопку и раскрывает выбор", async () => {
    const user = userEvent.setup();
    renderCard();

    const button = screen.getByRole("button", {
      name: "добавить «Victoria Peak & Peak Tram» в день",
    });
    await user.click(button);

    expect(screen.getByRole("list", { name: "куда добавить «Victoria Peak & Peak Tram»" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "день Д1 · 07.12 · Гонконг" })).toBeEnabled();
  });

  it("день, где карточка уже стоит, заблокирован", async () => {
    const user = userEvent.setup();
    renderCard();

    await user.click(
      screen.getByRole("button", { name: "добавить «Victoria Peak & Peak Tram» в день" }),
    );
    expect(screen.getByRole("button", { name: "день Д5 · 12.12 · Чунцин" })).toBeDisabled();
  });

  it("клик по дню зовёт onAddToDay с его ключом", async () => {
    const user = userEvent.setup();
    const onAddToDay = vi.fn().mockResolvedValue(true);
    renderCard({ onAddToDay });

    await user.click(
      screen.getByRole("button", { name: "добавить «Victoria Peak & Peak Tram» в день" }),
    );
    await user.click(screen.getByRole("button", { name: "день Д1 · 07.12 · Гонконг" }));

    expect(onAddToDay).toHaveBeenCalledWith("v|07.12");
    expect(await screen.findByText("добавлено в Д1")).toBeInTheDocument();
  });

  it("onAddToDay вернул false — надписи «добавлено» нет", async () => {
    const user = userEvent.setup();
    const onAddToDay = vi.fn().mockResolvedValue(false);
    renderCard({ onAddToDay });

    await user.click(
      screen.getByRole("button", { name: "добавить «Victoria Peak & Peak Tram» в день" }),
    );
    await user.click(screen.getByRole("button", { name: "день Д1 · 07.12 · Гонконг" }));

    await waitFor(() => expect(onAddToDay).toHaveBeenCalledWith("v|07.12"));
    await waitFor(() =>
      expect(
        screen.queryByRole("list", { name: "куда добавить «Victoria Peak & Peak Tram»" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.queryByText(/добавлено в/)).not.toBeInTheDocument();
  });
});
