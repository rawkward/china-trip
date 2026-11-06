import { RefreshCw, X } from "lucide-react";
import { Button } from "../ui";
import { formatDateIso, formatRate } from "../../lib/budget/numbers";
import { rateDiffers } from "../../lib/budget/fx";
import type { FxRate, ParamsDoc } from "../../lib/budget/types";

interface FxBannerProps {
  fx: FxRate | null;
  params: ParamsDoc;
  busy: boolean;
  onApply: () => void;
  onDismiss: () => void;
}

export function FxBanner({ fx, params, busy, onApply, onDismiss }: FxBannerProps) {
  if (!fx) return null;
  const cnyDiffers = rateDiffers(params.cny_rate, fx.cny);
  const hkdDiffers = rateDiffers(params.hkd_rate, fx.hkd);
  if (!cnyDiffers && !hkdDiffers) return null;

  const date = formatDateIso(fx.date);
  const when = date ? `ЦБ на ${date}` : "ЦБ";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-card border border-accent/25 bg-accent-soft px-4 py-3">
      <p className="text-[0.85rem] text-accent-ink">
        {when}: ¥{formatRate(fx.cny)} · HK${formatRate(fx.hkd)} — обновить сохранённый курс?
      </p>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="primary" size="sm" disabled={busy} onClick={onApply}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Обновить
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onDismiss}>
          <X className="size-3.5" aria-hidden="true" />
          Скрыть
        </Button>
      </div>
    </div>
  );
}
