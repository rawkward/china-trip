import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { clearAuth } from "../edits/auth";
import { toast } from "../components/ui/Toast";
import { budgetApi } from "../lib/budget/api";
import { readBudgetCache, writeBudgetCache } from "../lib/budget/cache";
import { errorText, isUnauthorized } from "../lib/budget/errors";
import type { BudgetData } from "../lib/budget/types";

export type BudgetStatus = "locked" | "loading" | "ready" | "error";

interface UseBudgetDataOptions {
  token: string | null;
  /** Сбросить открытые формы при каждой перезагрузке — как делала страница раньше. */
  onLoadStart: () => void;
}

export interface BudgetDataState {
  status: BudgetStatus;
  data: BudgetData | null;
  setData: Dispatch<SetStateAction<BudgetData | null>>;
  error: string;
  cacheAt: number | null;
  stale: boolean;
  offline: boolean;
  freshTick: number;
  retry: () => void;
}

/** Загрузка бюджета: кэш сразу, свежие данные следом, офлайн-режим при ошибке. */
export function useBudgetData({ token, onLoadStart }: UseBudgetDataOptions): BudgetDataState {
  const [status, setStatus] = useState<BudgetStatus>(token ? "loading" : "locked");
  const [data, setData] = useState<BudgetData | null>(null);
  const [error, setError] = useState("");
  const [cacheAt, setCacheAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [offline, setOffline] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [freshTick, setFreshTick] = useState(0);

  const onLoadStartRef = useRef(onLoadStart);
  onLoadStartRef.current = onLoadStart;

  useEffect(() => {
    if (!token) {
      setStatus("locked");
      setData(null);
      setError("");
      setCacheAt(null);
      setStale(false);
      setOffline(false);
      return;
    }

    const controller = new AbortController();
    const cached = readBudgetCache();
    const hadCache = Boolean(cached);
    setError("");
    onLoadStartRef.current();

    if (cached) {
      setData(cached.data);
      setCacheAt(cached.at);
      setStale(true);
      setOffline(false);
      setStatus("ready");
    } else {
      setStatus("loading");
    }

    budgetApi
      .get(token, controller.signal)
      .then((fresh) => {
        setData(fresh);
        writeBudgetCache(fresh);
        setStatus("ready");
        setStale(false);
        setCacheAt(null);
        setOffline(false);
        setFreshTick((n) => n + 1);
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === "AbortError") return;
        if (isUnauthorized(err)) {
          clearAuth();
          return;
        }
        const message = errorText(err);
        if (hadCache) {
          setOffline(true);
          setStale(false);
          setStatus("ready");
          toast(message, "error");
        } else {
          setError(message);
          setStatus("error");
        }
      });

    return () => controller.abort();
  }, [token, reloadTick]);

  const retry = useCallback(() => setReloadTick((n) => n + 1), []);

  return { status, data, setData, error, cacheAt, stale, offline, freshTick, retry };
}
