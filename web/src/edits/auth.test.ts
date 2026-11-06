import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../lib/storage";

async function freshAuth() {
  vi.resetModules();
  return import("./auth");
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("чтение токена из хранилища", () => {
  it("пустое хранилище — токена нет", async () => {
    const auth = await freshAuth();
    expect(auth.getAuth()).toEqual({ token: null, expiresAt: 0 });
  });

  it("живой токен подхватывается при старте", async () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    localStorage.setItem(STORAGE_KEYS.token, "abc");
    localStorage.setItem(STORAGE_KEYS.tokenExp, String(exp));
    const auth = await freshAuth();
    expect(auth.getAuth()).toEqual({ token: "abc", expiresAt: exp });
  });

  it("просроченный токен отбрасывается", async () => {
    localStorage.setItem(STORAGE_KEYS.token, "abc");
    localStorage.setItem(STORAGE_KEYS.tokenExp, String(Math.floor(Date.now() / 1000) - 10));
    const auth = await freshAuth();
    expect(auth.getAuth().token).toBeNull();
  });

  it("мусор в сроке жизни трактуется как отсутствие токена", async () => {
    localStorage.setItem(STORAGE_KEYS.token, "abc");
    localStorage.setItem(STORAGE_KEYS.tokenExp, "не число");
    const auth = await freshAuth();
    expect(auth.getAuth().token).toBeNull();
  });
});

describe("запись и очистка", () => {
  it("setAuth пишет оба ключа и уведомляет подписчиков", async () => {
    const auth = await freshAuth();
    const spy = vi.fn();
    auth.subscribeAuth(spy);

    auth.setAuth("tok", 1234);

    expect(localStorage.getItem(STORAGE_KEYS.token)).toBe("tok");
    expect(localStorage.getItem(STORAGE_KEYS.tokenExp)).toBe("1234");
    expect(auth.getAuth()).toEqual({ token: "tok", expiresAt: 1234 });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("clearAuth стирает оба ключа", async () => {
    const auth = await freshAuth();
    auth.setAuth("tok", 1234);
    auth.clearAuth();
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.tokenExp)).toBeNull();
    expect(auth.getAuth()).toEqual({ token: null, expiresAt: 0 });
  });

  it("отписка прекращает уведомления", async () => {
    const auth = await freshAuth();
    const spy = vi.fn();
    const off = auth.subscribeAuth(spy);
    off();
    auth.setAuth("tok", 1);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("loginWithPassword", () => {
  it("пустой пароль не уходит на сервер", async () => {
    const auth = await freshAuth();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(auth.loginWithPassword("")).rejects.toThrow("введите пароль");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("успех сохраняет токен", async () => {
    const auth = await freshAuth();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ token: "jwt", expires_at: 999 })),
    );
    await auth.loginWithPassword("secret");
    expect(auth.getAuth()).toEqual({ token: "jwt", expiresAt: 999 });
  });

  it("403 — «неверный пароль»", async () => {
    const auth = await freshAuth();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "wrong_password" }, 403)));
    await expect(auth.loginWithPassword("bad")).rejects.toThrow("неверный пароль");
    expect(auth.getAuth().token).toBeNull();
  });

  it("429 — просьба подождать", async () => {
    const auth = await freshAuth();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "rate" }, 429)));
    await expect(auth.loginWithPassword("x")).rejects.toThrow("слишком много попыток, подождите 15 минут");
  });

  it("500 — понятная ошибка со статусом", async () => {
    const auth = await freshAuth();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(auth.loginWithPassword("x")).rejects.toThrow("вход не удался (500)");
  });

  it("нет сети — «нет связи с сервером»", async () => {
    const auth = await freshAuth();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(auth.loginWithPassword("x")).rejects.toThrow("нет связи с сервером");
  });
});
