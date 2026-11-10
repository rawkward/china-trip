import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EditsProvider } from "../../edits/EditsContext";
import { isPark } from "../../lib/guide";
import { GuideSection } from "./GuideSection";

function stubApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
}

function renderGuide(kind: "stay" | "food" | "sight" | "tip", id: string) {
  return render(
    <EditsProvider>
      <GuideSection id={id} kind={kind} />
    </EditsProvider>,
  );
}

describe("GuideSection", () => {
  beforeEach(() => {
    localStorage.clear();
    stubApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("группирует карточки по городам в порядке маршрута", () => {
    renderGuide("stay", "stay");

    const hk = screen.getByRole("region", { name: "Гонконг" });
    const cq = screen.getByRole("region", { name: "Чунцин" });

    expect(within(hk).getByText("5")).toBeInTheDocument();
    expect(within(hk).getByText("Panda Hotel")).toBeInTheDocument();
    expect(within(hk).getByText("Eaton HK")).toBeInTheDocument();
    expect(within(hk).queryByText("Qixinggang district")).not.toBeInTheDocument();
    expect(within(cq).getByText("Qixinggang district")).toBeInTheDocument();
  });

  it("держит альтернативы под закрытой раскрывашкой", () => {
    renderGuide("sight", "sights");

    const alt = screen.getByText("Garden Hill");
    const details = alt.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    const main = screen.getByText("Victoria Peak & Peak Tram");
    expect(main.closest("details")).toBeNull();
    expect(screen.getAllByText(/^Альтернативы · \d+$/).length).toBeGreaterThan(0);
  });

  it("даёт карточке якорь #g-<id> и отступ под липкую шапку", () => {
    renderGuide("sight", "sights");

    const card = document.getElementById("g-victoria-peak");
    expect(card).not.toBeNull();
    expect(card).toHaveTextContent("Victoria Peak");
    expect(card).toHaveClass("scroll-mt-24");
  });

  it("не показывает редактор тега без токена", () => {
    renderGuide("stay", "stay");

    expect(screen.queryByRole("button", { name: "рекомендация" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "выбор" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "альтернатива" })).not.toBeInTheDocument();
  });

  it("фильтрует города быстрыми чипами", async () => {
    renderGuide("stay", "stay");

    const cqChip = screen.getByRole("button", { name: "Чунцин" });
    await userEvent.setup().click(cqChip);

    expect(screen.queryByRole("region", { name: "Гонконг" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Чунцин" })).toBeInTheDocument();
    expect(cqChip).toHaveAttribute("aria-pressed", "true");

    await userEvent.setup().click(screen.getByRole("button", { name: "Все города" }));

    expect(screen.getByRole("region", { name: "Гонконг" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Чунцин" })).toBeInTheDocument();
  });

  it("раздел парков показывает только карточки с флагом park", () => {
    render(
      <EditsProvider>
        <GuideSection id="parks" kind="sight" only={isPark} anchorPrefix="gp-" />
      </EditsProvider>,
    );

    expect(document.getElementById("gp-nan-lian")).not.toBeNull();
    expect(document.getElementById("gp-hong-kong-park")).not.toBeNull();
    expect(document.getElementById("gp-victoria-peak")).toBeNull();

    const park = screen.getByText("Hong Kong Park");
    expect(park.closest("details")).not.toBeNull();
  });
});
