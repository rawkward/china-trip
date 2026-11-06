import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { FxRate, ParamsDoc } from "../../lib/budget/types";
import { FxBanner } from "./FxBanner";

const params: ParamsDoc = { cny_rate: 10, hkd_rate: 10 };
const fx: FxRate = { cny: 12, hkd: 10, date: "2026-10-31" };

function renderBanner(overrides: Partial<Parameters<typeof FxBanner>[0]> = {}) {
  const onApply = vi.fn();
  const onDismiss = vi.fn();
  const view = render(
    <FxBanner fx={fx} params={params} busy={false} onApply={onApply} onDismiss={onDismiss} {...overrides} />,
  );
  return { ...view, onApply, onDismiss };
}

describe("FxBanner", () => {
  it("без курса ничего не рисует", () => {
    const { container } = renderBanner({ fx: null });
    expect(container).toBeEmptyDOMElement();
  });

  it("не предлагает обновление, если курсы не отличаются больше чем на 0,1 %", () => {
    const { container } = renderBanner({
      fx: { cny: 10, hkd: 10, date: "2026-10-31" },
    });
    expect(container).toBeEmptyDOMElement();
  });

  it("показывает курс ЦБ и отдаёт действия наружу", () => {
    const { onApply, onDismiss } = renderBanner();

    expect(screen.getByText(/ЦБ на 31\.10\.2026/)).toBeInTheDocument();
    expect(screen.getByText(/¥12,0000/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Обновить" }));
    expect(onApply).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Скрыть" }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("без даты пишет просто «ЦБ»", () => {
    renderBanner({ fx: { cny: 12, hkd: 10, date: "" } });
    expect(screen.getByText(/^ЦБ:/)).toBeInTheDocument();
  });

  it("в занятом состоянии кнопки заблокированы", () => {
    renderBanner({ busy: true });
    expect(screen.getByRole("button", { name: "Обновить" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Скрыть" })).toBeDisabled();
  });
});
