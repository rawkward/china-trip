import { GUIDE_TAG_KEY_RE, GUIDE_TAG_LABELS, guideTagKey } from "../../lib/guide";
import { cn } from "../../lib/cn";
import type { GuideItem, GuideKind, GuideTagValue } from "../../types";

export interface GuideCardProps {
  item: GuideItem;
  tag: GuideTagValue;
  kind: GuideKind;
  token: string | null;
  onTag: (key: string, tag: GuideTagValue) => void;
  anchorPrefix?: string;
}

const CARD_SHELL: Record<GuideKind, string> = {
  stay: "p-5 sm:p-6",
  food: "p-4",
  sight: "p-4 sm:p-5",
  tip: "p-4 sm:p-5",
};

const TITLE_SIZE: Record<GuideKind, string> = {
  stay: "text-[1.08rem]",
  food: "text-[0.96rem]",
  sight: "text-[1.02rem]",
  tip: "text-[1rem]",
};

const NOTE_SIZE: Record<GuideKind, string> = {
  stay: "text-[0.9rem]",
  food: "text-[0.82rem]",
  sight: "text-[0.86rem]",
  tip: "text-[0.88rem]",
};

const TAG_ORDER: GuideTagValue[] = ["rec", "choice", "alt"];

/** Карточка справочника: имя, адрес, часы, заметка, ссылки и правка тега. */
export function GuideCard({ item, tag, kind, token, onTag, anchorPrefix = "g-" }: GuideCardProps) {
  const key = guideTagKey(item);
  const canEdit = Boolean(token) && GUIDE_TAG_KEY_RE.test(key);
  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(item.maps || item.en);
  const showMaps = kind !== "tip" || Boolean(item.maps);
  const badgeText = item.badge || GUIDE_TAG_LABELS[tag];

  return (
    <article
      id={anchorPrefix + item.id}
      className={cn(
        "surface scroll-mt-24 transition-colors target:border-accent target:ring-2 target:ring-accent/30",
        CARD_SHELL[kind],
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className={cn("leading-tight", TITLE_SIZE[kind])}>{item.en}</h3>
        {item.zh ? (
          <span className="text-[0.84rem] font-medium text-muted">{item.zh}</span>
        ) : null}
        <span className={cn("tag-pill ml-auto shrink-0", tag === "rec" && "border-accent/25 bg-accent-soft text-accent-ink")}>
          {badgeText}
        </span>
      </div>

      {item.addr ? (
        <div className="mt-1.5 text-[0.78rem] leading-snug text-muted-soft">{item.addr}</div>
      ) : null}

      {item.hours && item.hours !== "—" ? (
        <div className="mt-1.5 text-[0.78rem] leading-snug font-semibold text-ink-soft">
          {item.hours}
        </div>
      ) : null}

      {item.note ? (
        <p
          className={cn(
            "mt-2 leading-relaxed text-ink-soft [&_a]:link-quiet [&_b]:font-semibold",
            NOTE_SIZE[kind],
          )}
          dangerouslySetInnerHTML={{ __html: item.note }}
        />
      ) : null}

      {item.site || showMaps ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.78rem]">
          {item.site ? (
            <a
              href={item.site}
              target="_blank"
              rel="noopener noreferrer"
              className="link-quiet font-medium"
            >
              {kind === "stay" && item.site?.includes("trip.com") ? "Trip.com ↗" : "сайт ↗"}
            </a>
          ) : null}
          {showMaps ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="link-quiet font-medium"
            >
              Google Maps ↗
            </a>
          ) : null}
        </div>
      ) : null}

      {canEdit ? (
        <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Тег карточки">
          {TAG_ORDER.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={tag === value}
              onClick={() => onTag(key, value)}
              className={cn("chip !px-2.5 !py-0.5 !text-[0.7rem]", tag === value && "chip-on")}
            >
              {GUIDE_TAG_LABELS[value]}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
