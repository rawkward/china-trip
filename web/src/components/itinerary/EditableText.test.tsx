import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TextEditingApi } from "./EditableText";
import { EditableText, hasText, InlineEditor } from "./EditableText";

function makeApi(overrides: Partial<TextEditingApi> = {}): TextEditingApi {
  return {
    token: "token",
    editing: {},
    setEditing: vi.fn(),
    saveText: vi.fn(async () => {}),
    ...overrides,
  };
}

describe("hasText", () => {
  it("отличает отсутствие поля от пустой строки", () => {
    expect(hasText({ title: "" }, "title")).toBe(true);
    expect(hasText({}, "title")).toBe(false);
    expect(hasText(undefined, "title")).toBe(false);
  });
});

describe("EditableText", () => {
  it("без токена рисует только текст", () => {
    render(
      <EditableText
        dayKey="k"
        field="stop:a:name"
        value="Остановка"
        edited={false}
        api={makeApi({ token: null })}
        ariaLabel="название остановки"
      />,
    );

    expect(screen.getByText("Остановка")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /править/ })).not.toBeInTheDocument();
  });

  it("с токеном открывает редактор нужного поля и помечает правку", () => {
    const api = makeApi();
    render(
      <EditableText
        dayKey="k"
        field="stop:a:name"
        value="Остановка"
        edited
        api={api}
        ariaLabel="название остановки"
      />,
    );

    expect(screen.getByText("правка")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "править: название остановки" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: "stop:a:name" });
  });

  it("в режиме правки сохраняет новое значение в saveText", () => {
    const api = makeApi({ editing: { text: "stop:a:name" } });
    render(
      <EditableText
        dayKey="k"
        field="stop:a:name"
        value="Остановка"
        edited={false}
        api={api}
        ariaLabel="название остановки"
      />,
    );

    const input = screen.getByLabelText("название остановки");
    fireEvent.change(input, { target: { value: "Новая остановка" } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(api.saveText).toHaveBeenCalledWith("k", "stop:a:name", "Новая остановка");
  });

  it("в режиме правки отдаёт отмену и не показывает пустой сброс", () => {
    const api = makeApi({ editing: { text: "stop:a:name" } });
    render(
      <EditableText
        dayKey="k"
        field="stop:a:name"
        value="Остановка"
        edited={false}
        api={api}
      />,
    );

    expect(screen.queryByRole("button", { name: "Сбросить" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(api.setEditing).toHaveBeenCalledWith({ text: undefined });
  });
});

describe("InlineEditor", () => {
  it("text-режим рисует textarea, сброс пишет пустую строку", () => {
    const onSave = vi.fn();
    render(
      <InlineEditor
        field="note"
        value="Текст"
        kind="text"
        edited
        ariaLabel="Описание"
        onSave={onSave}
        onCancel={vi.fn()}
      />,
    );

    const textarea = screen.getByLabelText("Описание");
    expect(textarea.tagName).toBe("TEXTAREA");
    fireEvent.click(screen.getByRole("button", { name: "Сбросить" }));
    expect(onSave).toHaveBeenCalledWith("note", "");
  });
});
