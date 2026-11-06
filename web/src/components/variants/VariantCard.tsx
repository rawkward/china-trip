import { DATES, PHOTOS } from "../../data";
import { cn } from "../../lib/cn";
import { variantDateRange } from "../../lib/days";
import type { Variant } from "../../types";

function leadSummary(summary: string): string {
  const clean = summary.trim();
  if (!clean) return "";
  const sentences = clean.split(/(?<=[.!?])\s+/);
  let lead = sentences.slice(0, 2).join(" ").trim();
  if (lead.length > 170) {
    const cut = lead.slice(0, 170);
    const space = cut.lastIndexOf(" ");
    lead = (space > 80 ? cut.slice(0, space) : cut).trimEnd() + "…";
  }
  return lead;
}

function badgeFor(variant: Variant, active: boolean): string {
  if (variant.main) return active ? "основной · показан сейчас" : "основной";
  return active ? "показан сейчас" : "вариант";
}

interface VariantCardProps {
  variant: Variant;
  active: boolean;
  onSelect: (id: string) => void;
}

export function VariantCard({ variant, active, onSelect }: VariantCardProps) {
  const photo = PHOTOS[variant.photo];
  const badge = badgeFor(variant, active);
  const lead = leadSummary(variant.summary);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={() => onSelect(variant.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(variant.id);
        }
      }}
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden rounded-card border bg-surface text-left shadow-card",
        "transition duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        active
          ? "-translate-y-0.5 border-accent ring-2 ring-accent/35 shadow-lift"
          : "border-line hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-paper-deep">
        {photo?.src ? (
          <img
            src={photo.src}
            alt={variant.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
          />
        ) : null}
        <span
          className={cn(
            "absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold text-paper backdrop-blur-sm",
            active ? "bg-accent/95" : variant.main ? "bg-accent/80" : "bg-ink/75",
          )}
        >
          {badge}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <h3 className="font-display text-[1.06rem] leading-tight">{variant.title}</h3>
        <div className="text-[0.8rem] font-medium text-muted">
          {variantDateRange(variant, DATES)}
        </div>

        {lead && (
          <p className="line-clamp-3 text-[0.82rem] leading-relaxed text-muted-soft">{lead}</p>
        )}

        <ul aria-label="Плюсы" className="mt-1 grid gap-1">
          {variant.pros.map((item) => (
            <li
              key={item}
              className="grid grid-cols-[1rem_1fr] items-start gap-1.5 text-[0.85rem] leading-snug text-ink-soft"
            >
              <span aria-hidden="true" className="font-bold text-[#4d7c0f]">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <ul aria-label="Минусы" className="grid gap-1">
          {variant.cons.map((item) => (
            <li
              key={item}
              className="grid grid-cols-[1rem_1fr] items-start gap-1.5 text-[0.85rem] leading-snug text-muted"
            >
              <span aria-hidden="true" className="font-bold text-accent">
                —
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto border-t border-line pt-3">
          <div className="text-[0.68rem] font-bold tracking-[0.12em] text-muted-soft uppercase">
            бюджет
          </div>
          <div className="font-display text-[1.12rem] leading-snug text-accent-ink">
            {variant.budget}
          </div>
        </div>
      </div>
    </article>
  );
}

