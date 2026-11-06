import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { DATES, VARIANTS } from "../data";
import { buildDays } from "../lib/days";
import { readString, STORAGE_KEYS, writeString } from "../lib/storage";
import type { Day, Variant } from "../types";

interface VariantValue {
  variants: Variant[];
  activeId: string;
  variant: Variant;
  days: Day[];
  setVariant: (id: string) => void;
}

const VariantContext = createContext<VariantValue | null>(null);

function pickInitialId(variants: Variant[]): string {
  const stored = readString(STORAGE_KEYS.variant);
  if (stored && variants.some((v) => v.id === stored)) return stored;
  const main = variants.find((v) => v.main) ?? variants[0];
  return main.id;
}

export function VariantProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState(() => pickInitialId(VARIANTS));

  const setVariant = useCallback((id: string) => {
    if (!VARIANTS.some((v) => v.id === id)) return;
    setActiveId(id);
    writeString(STORAGE_KEYS.variant, id);
  }, []);

  const value = useMemo<VariantValue>(() => {
    const variant = VARIANTS.find((v) => v.id === activeId) ?? VARIANTS[0];
    return {
      variants: VARIANTS,
      activeId: variant.id,
      variant,
      days: buildDays(variant, DATES),
      setVariant,
    };
  }, [activeId, setVariant]);

  return <VariantContext.Provider value={value}>{children}</VariantContext.Provider>;
}

export function useVariant(): VariantValue {
  const ctx = useContext(VariantContext);
  if (!ctx) throw new Error("useVariant must be used inside <VariantProvider>");
  return ctx;
}
