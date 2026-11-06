import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { sectionCopy } from "../../content/copy";

export interface SectionProps {
  /** id раздела — он же якорь навигации */
  id: string;
  /** ключ текста в content/copy.json (по умолчанию = id) */
  copyKey?: string;
  /** кнопка/переключатель справа от заголовка */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** скрыть заголовок и лид (когда раздел сам рисует шапку) */
  bare?: boolean;
}

export function Section({ id, copyKey, action, children, className, bare }: SectionProps) {
  const copy = sectionCopy(copyKey ?? id);
  return (
    <section id={id} className={cn("scroll-mt-24 py-10 first:pt-6 sm:py-14", className)}>
      {!bare && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="max-w-3xl">
            {copy.eyebrow && <div className="eyebrow mb-1.5">{copy.eyebrow}</div>}
            {copy.title && (
              <h2 className="text-[1.6rem] sm:text-[2.05rem]">{copy.title}</h2>
            )}
            {copy.lede && <p className="prose-lede mt-2 max-w-[70ch]">{copy.lede}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Rule({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}
