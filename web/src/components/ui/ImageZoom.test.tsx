import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ZoomImage } from "./ImageZoom";

const ALT = "Фужун: 1–10 — обход";
const SRC = "/assets/img/furong-route-map.webp";

function renderImage() {
  const user = userEvent.setup();
  render(<ZoomImage src={SRC} alt={ALT} />);
  return { user };
}

async function openViewer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Открыть крупнее/ }));
  return screen.getByRole("dialog");
}

describe("ZoomImage", () => {
  it("подписывает миниатюру через alt", () => {
    renderImage();
    const thumb = screen.getByRole("button", { name: /Открыть крупнее/ });
    expect(thumb).toHaveAccessibleName(`Открыть крупнее: ${ALT}`);
    expect(thumb).toHaveAttribute("title", `Открыть крупнее: ${ALT}`);
    expect(screen.getByAltText(ALT)).toHaveAttribute("src", SRC);
  });

  it("по клику открывает диалог и не плодит второй", async () => {
    const { user } = renderImage();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await openViewer(user);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Открыть крупнее/ }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
  });

  it("зумит кнопками и сбрасывает масштаб", async () => {
    const { user } = renderImage();
    await openViewer(user);

    expect(screen.getByText("100%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Увеличить" }));
    expect(screen.getByText("150%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Уменьшить" }));
    expect(screen.getByText("100%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Увеличить" }));
    await user.click(screen.getByRole("button", { name: "Увеличить" }));
    expect(screen.getByText("200%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Сброс" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("закрывается по Escape", async () => {
    const { user } = renderImage();
    await openViewer(user);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("закрывается по клику на фон", async () => {
    const { user } = renderImage();
    const dialog = await openViewer(user);

    await user.click(dialog);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("закрывается кнопкой ×", async () => {
    const { user } = renderImage();
    await openViewer(user);

    await user.click(screen.getByRole("button", { name: "Закрыть" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
