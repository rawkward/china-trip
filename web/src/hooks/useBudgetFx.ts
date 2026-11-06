import { useCallback, useRef, useState } from "react";
import { toast } from "../components/ui/Toast";
import { CBR_DAILY_URL, readCbrDate, readCbrRate } from "../lib/budget/fx";
import type { FxRate } from "../lib/budget/types";

export interface BudgetFxState {
  fx: FxRate | null;
  failed: boolean;
  dismissed: boolean;
  load: () => void;
  resetRequest: () => void;
  reveal: () => void;
  dismiss: () => void;
}

/** Курс ЦБ грузится один раз на сессию, по кнопке «Повторить» — заново. */
export function useBudgetFx(): BudgetFxState {
  const [fx, setFx] = useState<FxRate | null>(null);
  const [failed, setFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const requestedRef = useRef(false);

  const load = useCallback(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void (async () => {
      try {
        const response = await fetch(CBR_DAILY_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`http ${response.status}`);
        const doc: unknown = await response.json();
        const cny = readCbrRate(doc, "CNY");
        const hkd = readCbrRate(doc, "HKD");
        if (cny === null || hkd === null) throw new Error("cbr shape");
        setFx({ cny, hkd, date: readCbrDate(doc) });
        setFailed(false);
      } catch {
        setFailed(true);
        toast("курс ЦБ не получен", "error");
      }
    })();
  }, []);

  const resetRequest = useCallback(() => {
    requestedRef.current = false;
  }, []);
  const reveal = useCallback(() => setDismissed(false), []);
  const dismiss = useCallback(() => setDismissed(true), []);

  return { fx, failed, dismissed, load, resetRequest, reveal, dismiss };
}
