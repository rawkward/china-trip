import { ApiError } from "../../api/client";

const SERVER_MESSAGES: Record<string, string> = {
  wrong_password: "неверный пароль",
  unauthorized: "требуется вход",
  too_many_attempts: "слишком много попыток, попробуйте позже",
  not_found: "не найдено",
  bad_json: "некорректный запрос",
  bad_route: "неизвестный запрос",
  body_too_large: "слишком большой запрос",
  server_misconfigured: "сервер не настроен",
  internal: "внутренняя ошибка сервера",
};

/** Понятный текст для тоста: 401/403/429 и коды Worker'а переводим, остальное — как есть. */
export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return err.message || "сервер недоступен. Проверьте подключение.";
    if (err.status === 401) return "сессия истекла — войдите заново";
    if (err.status === 403) return "неверный пароль";
    if (err.status === 429) return "слишком много попыток, попробуйте позже";
    const mapped = SERVER_MESSAGES[err.message];
    if (mapped) return mapped;
    return err.message || `ошибка сервера (${err.status})`;
  }
  if (err instanceof Error && err.message) return err.message;
  return "неизвестная ошибка";
}

export function isUnauthorized(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}
