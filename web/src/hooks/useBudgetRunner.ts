import { useCallback, useRef, useState } from "react";
import { clearAuth } from "../edits/auth";
import { toast } from "../components/ui/Toast";
import { errorText, isUnauthorized } from "../lib/budget/errors";

export interface BudgetRunner {
  busy: boolean;
  run: (fn: () => Promise<void>) => void;
}

/** Одна мутация бюджета за раз: ошибки — тостом, офлайн — отказом. */
export function useBudgetRunner(offline: boolean): BudgetRunner {
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const run = useCallback(
    (fn: () => Promise<void>) => {
      if (offline) {
        toast("нет связи — раздел открыт только для просмотра", "error");
        return;
      }
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      void (async () => {
        try {
          await fn();
        } catch (err) {
          if (isUnauthorized(err)) {
            clearAuth();
            toast("сессия истекла — войдите заново", "error");
            return;
          }
          toast(errorText(err), "error");
        } finally {
          busyRef.current = false;
          setBusy(false);
        }
      })();
    },
    [offline],
  );

  return { busy, run };
}
