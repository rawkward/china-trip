/** Склонение счётчика блюд: 1 — блюдо, 2–4 — блюда, 0 и 5+ — блюд. */
export function dishCountLabel(n: number): string {
  const tail = n % 100;
  if (tail >= 11 && tail <= 14) return "блюд";
  const last = n % 10;
  if (last === 1) return "блюдо";
  if (last >= 2 && last <= 4) return "блюда";
  return "блюд";
}
