/** FNV-1a хеш названия остановки в base36 — стабильный ключ правки текста. */
export function stopSlug(text: string | undefined | null): string {
  const str = String(text ?? "");
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0)
    .toString(36)
    .slice(0, 6)
    .padEnd(6, "0");
}
