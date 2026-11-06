import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AddCityForm } from "./AddCityForm";
import { CategoryNameForm } from "./CategoryNameForm";

describe("CategoryNameForm", () => {
  it("не отправляет пустое имя и показывает ошибку", () => {
    const onSubmit = vi.fn();
    render(<CategoryNameForm initial="   " busy={false} onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Укажите название категории");
  });

  it("отправляет обрезанное имя и отдаёт отмену наружу", () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<CategoryNameForm initial="" busy={false} onSubmit={onSubmit} onCancel={onCancel} />);

    const input = screen.getByLabelText("Название категории");
    fireEvent.change(input, { target: { value: "  Кафе  " } });
    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(onSubmit).toHaveBeenCalledWith("Кафе");

    fireEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("в занятом состоянии блокирует форму", () => {
    render(<CategoryNameForm initial="Еда" busy onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Название категории")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Сохранить" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Отмена" })).toBeDisabled();
  });
});

describe("AddCityForm", () => {
  it("валидирует код города и не отправляет невалидный", () => {
    const onAdd = vi.fn();
    render(<AddCityForm existing={["hk"]} disabled={false} onAdd={onAdd} />);

    const input = screen.getByLabelText("Код нового города");
    fireEvent.change(input, { target: { value: "шанхай" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить город" }));

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/Латиница/);

    fireEvent.change(input, { target: { value: "hk" } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить город" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Такой город уже есть");
  });

  it("отправляет нормализованный префикс и очищает поле", () => {
    const onAdd = vi.fn();
    render(<AddCityForm existing={["hk"]} disabled={false} onAdd={onAdd} />);

    const input = screen.getByLabelText("Код нового города");
    fireEvent.change(input, { target: { value: " SH " } });
    fireEvent.click(screen.getByRole("button", { name: "Добавить город" }));

    expect(onAdd).toHaveBeenCalledWith("sh");
    expect(input).toHaveValue("");
  });

  it("Enter в поле тоже добавляет город", () => {
    const onAdd = vi.fn();
    render(<AddCityForm existing={[]} disabled={false} onAdd={onAdd} />);

    const input = screen.getByLabelText("Код нового города");
    fireEvent.change(input, { target: { value: "cq" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onAdd).toHaveBeenCalledWith("cq");
  });

  it("в занятом состоянии поле и кнопка заблокированы", () => {
    render(<AddCityForm existing={[]} disabled onAdd={vi.fn()} />);

    expect(screen.getByLabelText("Код нового города")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Добавить город" })).toBeDisabled();
  });
});
