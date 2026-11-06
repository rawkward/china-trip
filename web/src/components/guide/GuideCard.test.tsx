import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GuideItem } from "../../types";
import { GuideCard } from "./GuideCard";

const bare: GuideItem = {
  kind: "tip",
  city: "hk",
  id: "bare-tip",
  en: "Голая карточка",
};

describe("GuideCard: неполные данные", () => {
  it("без maps/site/hours/addr/zh не рисует пустых строк и ссылок", () => {
    const { container } = render(
      <GuideCard item={bare} tag="choice" kind="tip" token={null} onTag={vi.fn()} />,
    );

    expect(screen.getByText("Голая карточка")).toBeInTheDocument();
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(container.textContent).not.toContain("Google Maps");
    expect(container.textContent).not.toContain("сайт");
    expect(container.textContent).not.toContain("—");
  });

  it("не рисует Google Maps у тип-карточки без адреса, но рисует при наличии maps", () => {
    const { rerender, container } = render(
      <GuideCard item={bare} tag="choice" kind="tip" token={null} onTag={vi.fn()} />,
    );
    expect(container.querySelectorAll("a")).toHaveLength(0);

    rerender(
      <GuideCard
        item={{ ...bare, maps: "Hong Kong Central" }}
        tag="choice"
        kind="tip"
        token={null}
        onTag={vi.fn()}
      />,
    );
    expect(screen.getByRole("link", { name: "Google Maps ↗" })).toBeInTheDocument();
  });

  it("скрывает часы-заглушку «—»", () => {
    const { container } = render(
      <GuideCard
        item={{ ...bare, hours: "—" }}
        tag="choice"
        kind="tip"
        token={null}
        onTag={vi.fn()}
      />,
    );
    expect(container.textContent).not.toContain("—");
  });

  it("кастомный badge важнее подписи тега", () => {
    render(
      <GuideCard
        item={{ ...bare, badge: "100 HK$" }}
        tag="rec"
        kind="tip"
        token={null}
        onTag={vi.fn()}
      />,
    );
    expect(screen.getByText("100 HK$")).toBeInTheDocument();
    expect(screen.queryByText("рекомендация")).not.toBeInTheDocument();
  });
});

describe("GuideCard: редактор тега", () => {
  const item: GuideItem = {
    kind: "sight",
    city: "hk",
    id: "victoria-peak",
    en: "Victoria Peak & Peak Tram",
  };

  it("без токена редактора нет", () => {
    render(<GuideCard item={item} tag="choice" kind="sight" token={null} onTag={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "альтернатива" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "рекомендация" })).not.toBeInTheDocument();
  });

  it("с токеном сохраняет выбранное значение и помечает активную кнопку", () => {
    const onTag = vi.fn();
    const { rerender } = render(
      <GuideCard item={item} tag="choice" kind="sight" token="t" onTag={onTag} />,
    );

    expect(screen.getByRole("button", { name: "выбор" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "альтернатива" }));
    expect(onTag).toHaveBeenCalledWith("sight|hk|victoria-peak", "alt");

    rerender(<GuideCard item={item} tag="alt" kind="sight" token="t" onTag={onTag} />);
    expect(screen.getByRole("button", { name: "альтернатива" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("неактивный ключ с недопустимыми символами не даёт редактировать тег", () => {
    render(
      <GuideCard
        item={{ ...item, id: "НЕ ВАЛИДНО!" }}
        tag="choice"
        kind="sight"
        token="t"
        onTag={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "альтернатива" })).not.toBeInTheDocument();
  });
});
