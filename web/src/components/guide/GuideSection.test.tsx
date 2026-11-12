import { render, screen, waitFor, within } from "@testing-library/react";
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
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
  });

  it("группирует карточки по городам в порядке маршрута", () => {
    renderGuide("stay", "stay");

    const hk = screen.getByRole("region", { name: "Гонконг" });
    const cq = screen.getByRole("region", { name: "Чунцин" });

    expect(within(hk.closest("details") as HTMLElement).getByText("5")).toBeInTheDocument();
    expect(within(hk).getByText("Panda Hotel")).toBeInTheDocument();
    expect(within(hk).getByText("Eaton HK")).toBeInTheDocument();
    expect(within(hk).queryByText("Qixinggang district")).not.toBeInTheDocument();
    expect(within(cq).getByText("Qixinggang district")).toBeInTheDocument();
  });

  it("показывает альтернативы в общей сетке города, а города сворачивает", () => {
    renderGuide("sight", "sights");

    const alt = screen.getByText("Garden Hill");
    const city = alt.closest("details");
    expect(city).not.toBeNull();
    expect(city).not.toHaveAttribute("open");
    expect(city?.querySelector("summary")).toHaveTextContent("Гонконг");

    const main = screen.getByText("Victoria Peak & Peak Tram");
    expect(main.closest("details")).toBe(city);
    expect(screen.queryByText(/^Альтернативы · \d+$/)).not.toBeInTheDocument();
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

  it("фильтрует города быстрыми чипами и раскрывает выбранный город", async () => {
    renderGuide("stay", "stay");

    const cqChip = screen.getByRole("button", { name: "Чунцин" });
    expect(screen.getByRole("region", { name: "Чунцин" }).closest("details")).not.toHaveAttribute(
      "open",
    );
    await userEvent.setup().click(cqChip);

    expect(screen.queryByRole("region", { name: "Гонконг" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Чунцин" })).toBeInTheDocument();
    expect(cqChip).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Чунцин" }).closest("details")).toHaveAttribute(
        "open",
      ),
    );

    await userEvent.setup().click(screen.getByRole("button", { name: "Все города" }));

    expect(screen.getByRole("region", { name: "Гонконг" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Чунцин" })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Чунцин" }).closest("details")).not.toHaveAttribute(
        "open",
      ),
    );
  });

  it("раскрывает город по якорю #g-... при монтировании", async () => {
    window.location.hash = "#g-victoria-peak";
    renderGuide("sight", "sights");

    await waitFor(() => {
      expect(
        document.getElementById("g-victoria-peak")?.closest("details"),
      ).toHaveAttribute("open");
    });
  });

  it("раскрывает город по событию hashchange", async () => {
    renderGuide("sight", "sights");

    const details = document.getElementById("g-victoria-peak")?.closest("details");
    expect(details).not.toHaveAttribute("open");

    window.location.hash = "#g-victoria-peak";

    await waitFor(() => expect(details).toHaveAttribute("open"));
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
    const details = park.closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    expect(details?.querySelector("summary")).toHaveTextContent("Гонконг");
  });
});
