import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { clearAuth } from "../edits/auth";
import { toast } from "../components/ui/Toast";
import { budgetApi } from "../lib/budget/api";
import { errorText, isUnauthorized } from "../lib/budget/errors";
import type { BudgetData, ParamsDoc } from "../lib/budget/types";

interface UseBudgetParamsOptions {
  token: string | null;
  setData: Dispatch<SetStateAction<BudgetData | null>>;
}

export interface BudgetParamsState {
  saved: boolean;
  resetKey: number;
  change: (key: string, value: number) => void;
  applyNow: (patch: ParamsDoc) => Promise<void>;
  bumpReset: () => void;
  cancel: () => void;
}

const PATCH_DELAY_MS = 600;
const SAVED_FLASH_MS = 1800;

/** Автосохранение параметров: локальное значение сразу, PATCH — с задержкой. */
export function useBudgetParams({
  token,
  setData,
}: UseBudgetParamsOptions): BudgetParamsState {
  const [saved, setSaved] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const pendingRef = useRef<ParamsDoc | null>(null);
  const patchTimerRef = useRef<number | null>(null);
  const patchSeqRef = useRef(0);
  const savedTimerRef = useRef<number | null>(null);

  const flashSaved = useCallback(() => {
    setSaved(true);
    if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    savedTimerRef.current = window.setTimeout(() => setSaved(false), SAVED_FLASH_MS);
  }, []);

  const mergeUpdated = useCallback(
    (updated: ParamsDoc) => {
      setData((prev) =>
        prev
          ? {
              ...prev,
              params: { ...updated, ...(pendingRef.current ?? {}) },
              params_updated_at: Math.floor(Date.now() / 1000),
            }
          : prev,
      );
    },
    [setData],
  );

  const cancel = useCallback(() => {
    if (patchTimerRef.current) {
      window.clearTimeout(patchTimerRef.current);
      patchTimerRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  useEffect(
    () => () => {
      if (patchTimerRef.current) window.clearTimeout(patchTimerRef.current);
      if (savedTimerRef.current) window.clearTimeout(savedTimerRef.current);
    },
    [],
  );

  const flush = useCallback(async () => {
    patchTimerRef.current = null;
    const patch = pendingRef.current;
    pendingRef.current = null;
    if (!patch || !Object.keys(patch).length || !token) return;

    const seq = ++patchSeqRef.current;
    try {
      const updated = await budgetApi.patchParams(patch, token);
      if (seq !== patchSeqRef.current) return;
      mergeUpdated(updated);
      flashSaved();
    } catch (err) {
      if (isUnauthorized(err)) {
        clearAuth();
        toast("сессия истекла — войдите заново", "error");
        return;
      }
      toast(errorText(err), "error");
    }
  }, [token, mergeUpdated, flashSaved]);

  const change = useCallback(
    (key: string, value: number) => {
      setData((prev) =>
        prev ? { ...prev, params: { ...prev.params, [key]: value } } : prev,
      );
      pendingRef.current = { ...(pendingRef.current ?? {}), [key]: value };
      if (patchTimerRef.current) window.clearTimeout(patchTimerRef.current);
      patchTimerRef.current = window.setTimeout(() => void flush(), PATCH_DELAY_MS);
    },
    [setData, flush],
  );

  const applyNow = useCallback(
    async (patch: ParamsDoc) => {
      if (!token) return;
      const updated = await budgetApi.patchParams(patch, token);
      mergeUpdated(updated);
    },
    [token, mergeUpdated],
  );

  const bumpReset = useCallback(() => setResetKey((n) => n + 1), []);

  return { saved, resetKey, change, applyNow, bumpReset, cancel };
}
