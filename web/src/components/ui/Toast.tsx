import { useEffect, useState } from "react";
import { cn } from "../../lib/cn";

export type ToastKind = "info" | "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(next: ToastItem[]) {
  items = next;
  for (const fn of listeners) fn();
}

/** Короткое сообщение внизу экрана: сохранено / не сохранилось. */
export function toast(message: string, kind: ToastKind = "info"): void {
  const id = nextId++;
  emit([...items, { id, message, kind }]);
  setTimeout(() => emit(items.filter((t) => t.id !== id)), kind === "error" ? 6000 : 3500);
}

export function clearToasts(): void {
  emit([]);
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items);

  useEffect(() => {
    const fn = () => setList(items);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  if (!list.length) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[1300] flex flex-col items-center gap-2 px-4"
    >
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto max-w-[min(90vw,32rem)] animate-in fade-in slide-in-from-bottom-2 rounded-full",
            "border px-4 py-2 text-[0.85rem] font-medium shadow-pop",
            t.kind === "error" && "border-accent/30 bg-accent-soft text-accent-ink",
            t.kind === "success" && "border-ink bg-ink text-paper",
            t.kind === "info" && "border-line bg-surface text-ink",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
