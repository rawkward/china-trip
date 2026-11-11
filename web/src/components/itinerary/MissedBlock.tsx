import { useState } from "react";
import { CITIES, GUIDE, GUIDE_ITEMS } from "@/data";
import { MISSED_NOTES } from "@/content/missed";
import { useEdits } from "@/edits/EditsContext";
import { useVariant } from "@/hooks/useVariant";
import { parseAddedStops, serializeAddedStops, tagForGuideKind } from "@/lib/added-stops";
import type { AddedStop } from "@/lib/added-stops";
import { noteKey } from "@/lib/days";
import { guideIdFor, tagOf } from "@/lib/guide";
import { stopSlug } from "@/lib/slug";
import type { Day, DayTag, GuideItem, GuideKind } from "@/types";
import { slugOfStop, tagIcon } from "./stopMeta";

const KIND_ORDER: GuideKind[] = ["stay", "food", "sight", "tip"];

interface MissedCard {
  key: string;
  city: string;
  name: string;
  slug: string;
  tag: DayTag;
  note?: string;
  guideId?: string;
  cost?: string;
  description?: string;
  fromDay?: number;
  sourceKeys: string[];
}

function guideCost(item: GuideItem): string {
  const value = (item as GuideItem & { cost?: unknown }).cost;
  return typeof value === "string" ? value.trim() : "";
}

function guideCard(item: GuideItem): MissedCard {
  return {
    key: "guide:" + item.kind + "|" + item.city + "|" + item.id,
    city: item.city,
    name: item.en,
    slug: stopSlug(item.en),
    tag: tagForGuideKind(item.kind),
    note: MISSED_NOTES[item.id],
    guideId: item.id,
    cost: guideCost(item),
    description: item.note,
    sourceKeys: [],
  };
}

/** «Что выпало»: альтернативы справочника и места, окончательно убранные из дней. */
export function MissedBlock() {
  const { token, dayTexts, saveText, guideTags } = useEdits();
  const { activeId, days } = useVariant();
  const [expanded, setExpanded] = useState<string | null>(null);

  const textsFor = (day: Day) => dayTexts[noteKey(activeId, day)] ?? {};
  const slugsOf = (value: string | undefined) =>
    (value ?? "").split(",").filter((slug) => slug.length > 0);
  const missedSlugs = (day: Day) => slugsOf(textsFor(day).missed);
  const addedSlugs = (day: Day) => parseAddedStops(textsFor(day).add).map((a) => a.s);

  const inRoute = (slug: string) =>
    days.some(
      (day) => day.places.some((stop) => slugOfStop(stop) === slug) || addedSlugs(day).includes(slug),
    );
  const inAdd = (slug: string) => days.some((day) => addedSlugs(day).includes(slug));

  const alts = GUIDE_ITEMS.filter(
    (item) => tagOf(item, guideTags) === "alt" && !inRoute(stopSlug(item.en)),
  );

  const moved: MissedCard[] = [];
  const seen = new Map<string, MissedCard>();
  for (const day of days) {
    const key = noteKey(activeId, day);
    for (const slug of missedSlugs(day)) {
      if (inAdd(slug)) continue;
      const stop = day.places.find((p) => slugOfStop(p) === slug);
      if (!stop) continue;
      const name = stop.title ?? stop.name ?? "";
      if (!name) continue;
      const dedupe = day.city + "|" + slug;
      const existing = seen.get(dedupe);
      if (existing) {
        if (!existing.sourceKeys.includes(key)) existing.sourceKeys.push(key);
        continue;
      }
      const id = stop._guide || guideIdFor(GUIDE_ITEMS, name);
      const card: MissedCard = {
        key: "moved:" + dedupe,
        city: day.city,
        name,
        slug,
        tag: stop.tag ?? "sight",
        guideId: id || undefined,
        cost: stop.cost,
        description: stop.note,
        fromDay: day.n,
        sourceKeys: [key],
      };
      seen.set(dedupe, card);
      moved.push(card);
    }
  }

  const cities: string[] = [];
  for (const card of moved) if (!cities.includes(card.city)) cities.push(card.city);
  for (const item of alts) if (!cities.includes(item.city)) cities.push(item.city);

  const rank = (city: string) => {
    const i = GUIDE.cityOrder.indexOf(city);
    return i === -1 ? GUIDE.cityOrder.length : i;
  };
  cities.sort((a, b) => rank(a) - rank(b));

  const groups = cities.map((city) => {
    const movedCards = moved
      .filter((card) => card.city === city)
      .sort((a, b) => (a.fromDay ?? 0) - (b.fromDay ?? 0) || a.name.localeCompare(b.name, "ru"));
    const guideCards = KIND_ORDER.flatMap((kind) =>
      alts
        .filter((item) => item.city === city && item.kind === kind)
        .sort((a, b) => a.en.localeCompare(b.en, "ru")),
    ).map(guideCard);
    return {
      city,
      label: CITIES[city]?.label ?? city,
      cards: movedCards.concat(guideCards),
    };
  });

  const total = groups.reduce((sum, group) => sum + group.cards.length, 0);

  const returnToDay = async (card: MissedCard, day: Day) => {
    const targetKey = noteKey(activeId, day);
    const targetTexts = dayTexts[targetKey] ?? {};
    const inDay = day.places.some((stop) => slugOfStop(stop) === card.slug);

    if (inDay) {
      const hidden = slugsOf(targetTexts.hide);
      if (!hidden.includes(card.slug)) {
        setExpanded(null);
        return;
      }
      await saveText(
        targetKey,
        "hide",
        hidden.filter((slug) => slug !== card.slug).join(","),
      );
      for (const sourceKey of card.sourceKeys) {
        const missed = slugsOf(dayTexts[sourceKey]?.missed);
        if (!missed.includes(card.slug)) continue;
        await saveText(
          sourceKey,
          "missed",
          missed.filter((slug) => slug !== card.slug).join(","),
        );
      }
      setExpanded(null);
      return;
    }

    const current = parseAddedStops(targetTexts.add);
    if (current.some((item) => item.s === card.slug)) return;

    const added: AddedStop = { s: card.slug, n: card.name, t: card.tag };
    if (card.cost) added.c = card.cost;
    if (card.description) added.d = card.description.slice(0, 300);
    if (card.guideId) added.g = card.guideId;

    await saveText(targetKey, "add", serializeAddedStops([...current, added]));
    for (const sourceKey of card.sourceKeys) {
      const slugs = slugsOf(dayTexts[sourceKey]?.missed);
      if (!slugs.includes(card.slug)) continue;
      await saveText(sourceKey, "missed", slugs.filter((slug) => slug !== card.slug).join(","));
    }
    setExpanded(null);
  };

  return (
    <details id="missed" className="group surface mt-6 scroll-mt-24">
      <summary className="list-none cursor-pointer p-4 select-none sm:p-5 [&::-webkit-details-marker]:hidden">
        <div className="eyebrow mb-1.5">Что выпало</div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="text-[1.15rem] transition-colors hover:text-accent sm:text-[1.3rem]">
            Можно посмотреть ещё
          </h3>
          <span className="text-[0.72rem] font-semibold text-muted-soft">· {total}</span>
          <span className="ml-auto text-[0.78rem] font-semibold text-muted group-open:hidden">
            развернуть
          </span>
          <span className="ml-auto hidden text-[0.78rem] font-semibold text-muted group-open:inline">
            свернуть
          </span>
        </div>
      </summary>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <p className="max-w-[70ch] text-[0.86rem] leading-relaxed text-muted">
          Эти места не вошли в план: часть лежит в справочнике с пометкой «альтернатива», часть
          убрана из дней окончательно.
          {token ? " По паролю любую запись можно вернуть в любой день своего города." : null}
        </p>

        <div className="mt-4 grid gap-5">
          {groups.map((group) => {
            const cityDays = days.filter((day) => day.city === group.city);
            return (
              <section key={group.city} aria-label={group.label}>
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="font-display text-[1.08rem] font-semibold sm:text-[1.2rem]">
                    {group.label}
                  </span>
                  <span className="text-[0.72rem] font-semibold text-muted-soft">
                    {group.cards.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                  {group.cards.map((card) => {
                    const open = expanded === card.key;
                    return (
                      <div
                        key={card.key}
                        className="flex flex-col gap-1 rounded-xl border border-line bg-paper p-3"
                      >
                        <span className="text-[0.68rem] font-bold tracking-[0.12em] text-muted-soft uppercase">
                          {group.label}
                        </span>
                        <span className="flex items-baseline gap-1.5 text-[0.94rem] font-semibold text-ink">
                          <span aria-hidden="true">{tagIcon(card.tag)}</span>
                          <span className="min-w-0">{card.name}</span>
                        </span>
                        {card.fromDay ? (
                          <span className="text-[0.78rem] font-semibold text-accent">
                            перенесено из Д{card.fromDay}
                          </span>
                        ) : null}
                        {card.note ? (
                          <span className="text-[0.82rem] leading-relaxed text-muted">
                            {card.note}
                          </span>
                        ) : null}
                        {card.guideId ? (
                          <a
                            href={"#g-" + card.guideId}
                            className="mt-auto pt-1 text-[0.78rem] font-semibold text-accent"
                          >
                            в справочнике →
                          </a>
                        ) : null}

                        {token ? (
                          <div className={card.guideId ? "" : "mt-auto pt-1"}>
                            <button
                              type="button"
                              className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-line-strong hover:text-accent"
                              aria-label={"вернуть " + card.name + " в день"}
                              aria-expanded={open}
                              onClick={() => setExpanded(open ? null : card.key)}
                            >
                              в день
                            </button>
                            {open ? (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {cityDays.map((day) => (
                                  <button
                                    key={day.n}
                                    type="button"
                                    className="rounded-full border border-line bg-surface px-2 py-0.5 text-[0.72rem] font-semibold text-muted transition-colors hover:border-accent hover:text-accent"
                                    onClick={() => void returnToDay(card, day)}
                                  >
                                    Д{day.n} · {day.date}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {group.city === "cq" ? (
                  <p className="mt-3 text-[0.78rem] leading-relaxed text-muted-soft">
                    Дрон-шоу в Чунцине — по возможности: постоянного графика нет, афишу публикуют за
                    неделю.
                  </p>
                ) : null}
              </section>
            );
          })}
        </div>
      </div>
    </details>
  );
}
