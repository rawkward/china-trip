import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearAuth, getAuth } from "../../edits/auth";
import { EditsProvider } from "../../edits/EditsContext";
import { Toaster } from "../ui/Toast";
import { AccessBar } from "./AccessBar";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function stubApi(login: () => Response | Promise<Response>) {
  const calls: Array<{ url: string; method: string; body?: unknown }> = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });

    if (url.endsWith("/api/login")) return login();
    if (method === "GET" && url.endsWith("/api/day-notes")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/stop-notes")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/day-texts")) return json({ notes: [] });
    if (method === "GET" && url.endsWith("/api/guide-tags")) return json({ tags: [] });
    return json({});
  });
  vi.stubGlobal("fetch", fetchMock);
  return { fetchMock, calls };
}

function renderBar() {
  return render(
    <EditsProvider>
      <AccessBar />
      <Toaster />
    </EditsProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  clearAuth();
});

afterEach(() => {
  cleanup();
  clearAuth();
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("AccessBar", () => {
  it("пустой пароль не отправляет запрос и показывает тост", async () => {
    const { calls } = stubApi(() => json({ token: "t", expires_at: 1 }));
    renderBar();

    await userEvent.setup().click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText("введите пароль")).toBeInTheDocument();
    expect(calls.some((c) => c.url.endsWith("/api/login"))).toBe(false);
  });

  it("успешный вход показывает панель «Правка открыта» и дату", async () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const { calls } = stubApi(() => json({ token: "t0ken", expires_at: expires }));
    renderBar();

    await userEvent.setup().type(screen.getByLabelText("Пароль для правок"), "test");
    await userEvent.setup().click(screen.getByRole("button", { name: "Войти" }));

    expect(await screen.findByText(/Правка открыта до/)).toBeInTheDocument();
    expect(getAuth().token).toBe("t0ken");

    const login = calls.find((c) => c.url.endsWith("/api/login"));
    expect(login?.body).toEqual({ password: "test" });
    expect(login?.method).toBe("POST");
  });

  it("Enter в поле пароля отправляет форму", async () => {
    stubApi(() => json({ token: "t0ken", expires_at: Math.floor(Date.now() / 1000) + 3600 }));
    renderBar();

    const input = screen.getByLabelText("Пароль для правок");
    await userEvent.setup().type(input, "test{Enter}");

    expect(await screen.findByText(/Правка открыта/)).toBeInTheDocument();
  });

  it("неверный пароль показывает ошибку в панели и тост", async () => {
    stubApi(() => json({ error: "wrong_password" }, 403));
    renderBar();

    await userEvent.setup().type(screen.getByLabelText("Пароль для правок"), "плохой");
    await userEvent.setup().click(screen.getByRole("button", { name: "Войти" }));

    await waitFor(() => {
      expect(screen.getByText("неверный пароль", { selector: "span" })).toBeInTheDocument();
    });
    expect((await screen.findAllByText("неверный пароль")).length).toBeGreaterThan(1);
    expect(getAuth().token).toBeNull();
  });

  it("выход снова показывает форму входа", async () => {
    stubApi(() => json({ token: "t0ken", expires_at: Math.floor(Date.now() / 1000) + 3600 }));
    renderBar();

    await userEvent.setup().type(screen.getByLabelText("Пароль для правок"), "test");
    await userEvent.setup().click(screen.getByRole("button", { name: "Войти" }));
    await screen.findByText(/Правка открыта/);

    await userEvent.setup().click(screen.getByRole("button", { name: "Выйти" }));

    expect(await screen.findByLabelText("Пароль для правок")).toBeInTheDocument();
    expect(getAuth().token).toBeNull();
  });
});
