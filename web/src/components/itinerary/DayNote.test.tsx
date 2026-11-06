import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EditsValue } from "@/edits/EditsContext";
import { DayNote, formatNoteDate } from "./DayNote";

type NoteEdits = Pick<
  EditsValue,
  "token" | "editing" | "setEditing" | "dayNotes" | "saveDayNote" | "deleteDayNote"
>;

function makeEdits(overrides: Partial<NoteEdits> = {}): NoteEdits {
  return {
    token: null,
    editing: {},
    setEditing: vi.fn(),
    dayNotes: {},
    saveDayNote: vi.fn(async () => {}),
    deleteDayNote: vi.fn(async () => {}),
    ...overrides,
  };
}

const NOTE = {
  day_key: "hk|07.12",
  body: "Взять зонт",
  updated_at: new Date(2026, 10, 6, 12, 30).getTime() / 1000,
};

describe("formatNoteDate", () => {
  it("форматирует дату и не падает на мусоре", () => {
    expect(formatNoteDate(NOTE.updated_at)).toBe("06.11, 12:30");
    expect(formatNoteDate(Number.NaN)).toBe("");
  });
});

describe("DayNote", () => {
  it("без заметки и без токена ничего не рисует", () => {
    const { container } = render(<DayNote dayKey="k" edits={makeEdits()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("без заметки при токене предлагает добавить её", () => {
    const edits = makeEdits({ token: "t" });
    render(<DayNote dayKey="hk|07.12" edits={edits} />);

    fireEvent.click(screen.getByRole("button", { name: "＋ заметка к дню" }));
    expect(edits.setEditing).toHaveBeenCalledWith({ note: "hk|07.12" });
  });

  it("показывает заметку всем, а кнопку правки — только при токене", () => {
    const edits = makeEdits({ token: "t" });
    render(<DayNote dayKey="hk|07.12" note={NOTE} edits={edits} />);

    expect(screen.getByText("Взять зонт")).toBeInTheDocument();
    expect(screen.getByText(/обновлено 06\.11, 12:30/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "править" }));
    expect(edits.setEditing).toHaveBeenCalledWith({ note: "hk|07.12" });
  });

  it("в режиме правки сохраняет и удаляет заметку", () => {
    const edits = makeEdits({ token: "t", editing: { note: "hk|07.12" } });
    render(<DayNote dayKey="hk|07.12" note={NOTE} edits={edits} />);

    const textarea = screen.getByLabelText("Заметка к дню");
    expect(textarea).toHaveValue("Взять зонт");
    fireEvent.change(textarea, { target: { value: "Новая заметка" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(edits.saveDayNote).toHaveBeenCalledWith("hk|07.12", "Новая заметка");

    fireEvent.click(screen.getByRole("button", { name: "Удалить" }));
    expect(edits.deleteDayNote).toHaveBeenCalledWith("hk|07.12");

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(edits.setEditing).toHaveBeenCalledWith({ note: undefined });
  });

  it("у новой заметки нет кнопки удаления", () => {
    const edits = makeEdits({ token: "t", editing: { note: "hk|07.12" } });
    render(<DayNote dayKey="hk|07.12" edits={edits} />);

    expect(screen.queryByRole("button", { name: "Удалить" })).not.toBeInTheDocument();
  });
});
