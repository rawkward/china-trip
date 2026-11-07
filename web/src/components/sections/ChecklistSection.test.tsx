import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../api/client";
import { clearAuth, setAuth } from "../../edits/auth";
import type { ChecklistGroup } from "../../types";
import { ChecklistSection } from "./ChecklistSection";

const GROUPS: ChecklistGroup[] = [
  {
    id: "grp_docs",
    cap: "Документы",
    sort: 0,
    items: [
      { id: "itm_passport", text: "<b>Загранпаспорт</b> — проверить срок", sort: 0 },
    ],
  },
  {
    id: "grp_money",
    cap: "Деньги",
    sort: 1,
    items: [{ id: "itm_cash", text: "Наличные юани", sort: 0 }],
  },
];

function signIn() {
  setAuth("test-token", Math.floor(Date.now() / 1000) + 3600);
}

beforeEach(() => {
  localStorage.clear();
  clearAuth();
  vi.spyOn(api, "listChecklist").mockResolvedValue(GROUPS);
  vi.spyOn(api, "createChecklistGroup").mockResolvedValue({
    id: "grp_new",
    cap: "Новая",
    sort: 2,
    items: [],
  });
  vi.spyOn(api, "updateChecklistGroup").mockResolvedValue(GROUPS[0]);
  vi.spyOn(api, "deleteChecklistGroup").mockResolvedValue({ deleted: true });
  vi.spyOn(api, "createChecklistItem").mockResolvedValue({
    id: "itm_new",
    text: "Новый пункт",
    sort: 1,
  });
  vi.spyOn(api, "updateChecklistItem").mockResolvedValue({
    id: "itm_passport",
    text: "Обновлённый пункт",
    sort: 0,
  });
  vi.spyOn(api, "deleteChecklistItem").mockResolvedValue({ deleted: true });
});

afterEach(() => {
  clearAuth();
  vi.restoreAllMocks();
});

describe("ChecklistSection", () => {
  it("без токена не рендерит ничего и не делает запросов", () => {
    const { container } = render(<ChecklistSection />);

    expect(container).toBeEmptyDOMElement();
    expect(api.listChecklist).not.toHaveBeenCalled();
  });

  it("с токеном загружает и показывает группы и пункты", async () => {
    signIn();
    render(<ChecklistSection />);

    expect(await screen.findByText("Документы")).toBeInTheDocument();
    expect(screen.getByText("Деньги")).toBeInTheDocument();
    expect(screen.getByText("Загранпаспорт")).toBeInTheDocument();
    expect(screen.getByText("Наличные юани")).toBeInTheDocument();
    expect(screen.getByText("Отмечено 0 из 2")).toBeInTheDocument();
    expect(api.listChecklist).toHaveBeenCalledWith("test-token", expect.any(AbortSignal));
  });

  it("добавляет пункт через API", async () => {
    signIn();
    render(<ChecklistSection />);
    await screen.findByText("Документы");

    fireEvent.click(screen.getAllByRole("button", { name: "＋ пункт" })[0]);
    fireEvent.change(screen.getByLabelText("Новый пункт"), {
      target: { value: "<b>Страховка</b>" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(api.createChecklistItem).toHaveBeenCalledWith(
        "grp_docs",
        "<b>Страховка</b>",
        "test-token",
      ),
    );
  });

  it("правит текст пункта через API", async () => {
    signIn();
    render(<ChecklistSection />);
    await screen.findByText("Документы");

    fireEvent.click(screen.getAllByRole("button", { name: "править пункт" })[0]);
    const textarea = screen.getByLabelText("Текст пункта");
    expect(textarea).toHaveValue("<b>Загранпаспорт</b> — проверить срок");
    fireEvent.change(textarea, { target: { value: "<b>Паспорт</b> обновлён" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    await waitFor(() =>
      expect(api.updateChecklistItem).toHaveBeenCalledWith(
        "itm_passport",
        "<b>Паспорт</b> обновлён",
        "test-token",
      ),
    );
  });

  it("удаляет пункт после подтверждения", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    signIn();
    render(<ChecklistSection />);
    await screen.findByText("Документы");

    fireEvent.click(screen.getAllByRole("button", { name: "удалить пункт" })[0]);

    await waitFor(() =>
      expect(api.deleteChecklistItem).toHaveBeenCalledWith("itm_passport", "test-token"),
    );
  });

  it("добавляет, переименовывает и удаляет группу через API", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    signIn();
    render(<ChecklistSection />);
    await screen.findByText("Документы");

    fireEvent.click(screen.getByRole("button", { name: "＋ группа" }));
    fireEvent.change(screen.getByLabelText("Название"), { target: { value: "Аптечка" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() =>
      expect(api.createChecklistGroup).toHaveBeenCalledWith("Аптечка", "test-token"),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "переименовать группу" })[0]);
    fireEvent.change(screen.getByLabelText("Название группы"), {
      target: { value: "Документы и въезд" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    await waitFor(() =>
      expect(api.updateChecklistGroup).toHaveBeenCalledWith(
        "grp_docs",
        "Документы и въезд",
        "test-token",
      ),
    );

    fireEvent.click(screen.getAllByRole("button", { name: "удалить группу" })[0]);
    await waitFor(() =>
      expect(api.deleteChecklistGroup).toHaveBeenCalledWith("grp_docs", "test-token"),
    );
  });

  it("галочка пишется в localStorage под ключом chk-<id пункта>", async () => {
    signIn();
    render(<ChecklistSection />);

    const checkbox = await screen.findByRole("checkbox", { name: /Загранпаспорт/ });
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(JSON.parse(localStorage.getItem("china-trip-checklist-v1") ?? "{}")).toEqual({
      "chk-itm_passport": true,
    });
  });
});
