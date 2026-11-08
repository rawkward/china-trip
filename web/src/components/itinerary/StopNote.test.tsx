import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EditsValue } from "@/edits/EditsContext";
import { StopNote } from "./StopNote";

type NoteEdits = Pick<
  EditsValue,
  "token" | "editing" | "setEditing" | "stopNotes" | "saveStopNote" | "resetStopNote"
>;

function makeEdits(overrides: Partial<NoteEdits> = {}): NoteEdits {
  return {
    token: null,
    editing: {},
    setEditing: vi.fn(),
    stopNotes: {},
    saveStopNote: vi.fn(async () => {}),
    resetStopNote: vi.fn(async () => {}),
    ...overrides,
  };
}

const KEY = "hk|07.12|peak";
const NOTE = { stop_key: KEY, body: "Мой текст", updated_at: 1 };

describe("StopNote", () => {
  it("без текста и без токена не рисует пустую строку", () => {
    const { container } = render(<StopNote stopKey={KEY} edits={makeEdits()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("без авторского текста при токене предлагает его добавить", () => {
    const edits = makeEdits({ token: "t" });
    render(<StopNote stopKey={KEY} edits={edits} />);

    fireEvent.click(screen.getByRole("button", { name: "✎ добавить текст к остановке" }));
    expect(edits.setEditing).toHaveBeenCalledWith({ stop: KEY });
  });

  it("рисует авторский HTML и кнопку правки", () => {
    const edits = makeEdits({ token: "t" });
    render(<StopNote stopKey={KEY} original="<b>важно</b> и <a href='#'>ссылка</a>" edits={edits} />);

    expect(screen.getByText("важно")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ссылка" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "править текст к остановке" }));
    expect(edits.setEditing).toHaveBeenCalledWith({ stop: KEY });
  });

  it("показывает сохранённую правку и возвращает авторский текст", () => {
    const edits = makeEdits({ token: "t", stopNotes: { [KEY]: NOTE } });
    render(<StopNote stopKey={KEY} original="авторский" edits={edits} />);

    expect(screen.getByText(/правка:/)).toBeInTheDocument();
    expect(screen.getByText("Мой текст")).toBeInTheDocument();
    expect(screen.queryByText("авторский")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "вернуть мой текст" }));
    expect(edits.resetStopNote).toHaveBeenCalledWith(KEY);
  });

  it("редактор подставляет сохранённую правку и умеет вернуть авторский текст", () => {
    const edits = makeEdits({
      token: "t",
      editing: { stop: KEY },
      stopNotes: { [KEY]: NOTE },
    });
    render(<StopNote stopKey={KEY} original="авторский" edits={edits} />);

    const textarea = screen.getByLabelText("Текст к остановке");
    expect(textarea).toHaveValue("Мой текст");

    fireEvent.change(textarea, { target: { value: "Новый текст" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(edits.saveStopNote).toHaveBeenCalledWith(KEY, "Новый текст");

    fireEvent.click(screen.getByRole("button", { name: "Вернуть мой текст" }));
    expect(edits.resetStopNote).toHaveBeenCalledWith(KEY);

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(edits.setEditing).toHaveBeenCalledWith({ stop: undefined });
  });

  it("заметка с пустым телом скрывает авторский текст", () => {
    const empty = { stop_key: KEY, body: "", updated_at: 1 };
    const { container } = render(
      <StopNote stopKey={KEY} original="авторский" edits={makeEdits({ stopNotes: { [KEY]: empty } })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("пустое тело при токене показывает «описание скрыто» и возврат авторского текста", () => {
    const empty = { stop_key: KEY, body: "", updated_at: 1 };
    const edits = makeEdits({ token: "t", stopNotes: { [KEY]: empty } });
    render(<StopNote stopKey={KEY} original="авторский" edits={edits} />);

    expect(screen.queryByText("авторский")).not.toBeInTheDocument();
    expect(screen.getByText("описание скрыто")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "вернуть авторский текст" }));
    expect(edits.resetStopNote).toHaveBeenCalledWith(KEY);

    fireEvent.click(screen.getByRole("button", { name: "править текст к остановке" }));
    expect(edits.setEditing).toHaveBeenCalledWith({ stop: KEY });
  });

  it("у новой правки нет кнопки возврата", () => {
    const edits = makeEdits({ token: "t", editing: { stop: KEY } });
    render(<StopNote stopKey={KEY} original="авторский" edits={edits} />);

    expect(screen.queryByRole("button", { name: "Вернуть мой текст" })).not.toBeInTheDocument();
  });
});
