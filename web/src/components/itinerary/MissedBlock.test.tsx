import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GUIDE_ITEMS } from "@/data";
import { EditsProvider } from "@/edits/EditsContext";
import { tagOf } from "@/lib/guide";
import { MissedBlock } from "./MissedBlock";

function stubApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => new Promise(() => {})),
  );
}

function renderMissed() {
  return render(
    <EditsProvider>
      <MissedBlock />
    </EditsProvider>,
  );
}

describe("MissedBlock", () => {
  beforeEach(() => {
    localStorage.clear();
    stubApi();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("свёрнут по умолчанию и при раскрытии перечисляет все альтернативы справочника", () => {
    const { container } = renderMissed();
    const expected = GUIDE_ITEMS.filter((item) => tagOf(item, {}) === "alt");

    const details = container.querySelector("#missed");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");

    expect(screen.getByText("Можно посмотреть ещё")).toBeInTheDocument();
    expect(
      within(details as HTMLElement).getByText(`· ${expected.length}`),
    ).toBeInTheDocument();

    details!.setAttribute("open", "");

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(expected.length);
    expect(links.some((link) => /^#g-.+/.test(link.getAttribute("href") ?? ""))).toBe(true);
  });
});
