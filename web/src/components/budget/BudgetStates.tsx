import { Clock3 } from "lucide-react";
import { Section } from "../layout/Section";
import { AccessBar } from "../layout/AccessBar";
import { Button } from "../ui";
import { formatClock } from "../../lib/budget/numbers";

const SKELETON_WIDTHS = ["36%", "78%", "64%", "88%", "52%"];

/** Бюджет закрыт паролем — та же панель доступа, что и у остальной страницы. */
export function BudgetLocked() {
  return (
    <Section id="budget">
      <div className="surface p-5 sm:p-6">
        <div className="eyebrow mb-1.5">Личный бюджет</div>
        <h3 className="text-[1.15rem]">Раздел закрыт паролем</h3>
        <p className="mt-1.5 max-w-[60ch] text-[0.86rem] leading-relaxed text-muted">
          Это личный бюджет поездки. Введите общий пароль, чтобы открыть статьи и параметры.
        </p>
        <div className="mt-4">
          <AccessBar />
        </div>
      </div>
    </Section>
  );
}

export function BudgetLoading() {
  return (
    <Section id="budget">
      <div className="surface p-5" role="status" aria-label="Загружаем бюджет">
        <div className="space-y-2.5">
          {SKELETON_WIDTHS.map((width) => (
            <div
              key={width}
              className="h-3 animate-pulse rounded-full bg-paper-deep"
              style={{ width }}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

export function BudgetError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Section id="budget">
      <div className="surface p-5">
        <h3 className="text-[1.15rem]">Не удалось загрузить бюджет</h3>
        <p className="mt-1.5 text-[0.85rem] text-accent-ink" role="alert">
          {error}
        </p>
        <Button variant="primary" size="sm" className="mt-3" onClick={onRetry}>
          Повторить
        </Button>
      </div>
    </Section>
  );
}

interface BudgetCacheNoticeProps {
  cacheAt: number;
  offline: boolean;
  onRetry: () => void;
}

/** Пометка «данные из кэша»: время снимка и кнопка повторной загрузки в офлайне. */
export function BudgetCacheNotice({ cacheAt, offline, onRetry }: BudgetCacheNoticeProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-paper-deep/60 px-3 py-2 text-[0.78rem] text-muted">
      <Clock3 className="size-3.5 text-accent" aria-hidden="true" />
      <span>
        данные из кэша с {formatClock(cacheAt)}
        {offline ? ", офлайн" : ", обновляем…"}
      </span>
      {offline && (
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onRetry}>
          Повторить
        </Button>
      )}
    </div>
  );
}
