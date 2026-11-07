import { CITIES, GUIDE, GUIDE_ITEMS } from "../../data";
import { useEdits } from "../../edits/EditsContext";
import { cn } from "../../lib/cn";
import { groupGuideByCity, tagOf } from "../../lib/guide";
import type { GuideItem, GuideKind, GuideTagValue } from "../../types";
import { Section } from "../layout/Section";
import { GuideCard } from "./GuideCard";

export interface GuideSectionProps {
  id: string;
  kind: GuideKind;
  /** раздел парков переиспользует вид sight, но со своим фильтром и своими якорями */
  only?: (it: GuideItem) => boolean;
  anchorPrefix?: string;
}

const GRID: Record<GuideKind, string> = {
  stay: "grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2",
  food: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3",
  sight: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3",
  tip: "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3",
};

/** Справочник одного вида: города в порядке маршрута, альтернативы под раскрывашкой. */
export function GuideSection({ id, kind, only, anchorPrefix = "g-" }: GuideSectionProps) {
  const { token, guideTags, saveGuideTag } = useEdits();
  const groups = groupGuideByCity(GUIDE_ITEMS, GUIDE.cityOrder, CITIES, kind, guideTags, only);

  const handleTag = (key: string, tag: GuideTagValue) => {
    void saveGuideTag(key, tag);
  };

  return (
    <Section id={id}>
      <div className="grid gap-6">
        {groups.map((group) => (
          <section key={group.city} aria-label={group.label}>
            <div className="mb-3 flex items-baseline gap-2">
              <span className="font-display text-[1.08rem] font-semibold sm:text-[1.2rem]">
                {group.label}
              </span>
              <span className="text-[0.72rem] font-semibold text-muted-soft">
                {group.total}
              </span>
            </div>

            <div className={GRID[kind]}>
              {group.main.map((item) => (
                <GuideCard
                  key={item.id}
                  item={item}
                  kind={kind}
                  tag={tagOf(item, guideTags)}
                  token={token}
                  onTag={handleTag}
                  anchorPrefix={anchorPrefix}
                />
              ))}
            </div>

            {group.alts.length > 0 ? (
              <details className="mt-3">
                <summary className="w-fit cursor-pointer text-[0.8rem] font-semibold text-muted transition-colors hover:text-accent">
                  Альтернативы · {group.alts.length}
                </summary>
                <div className={cn(GRID[kind], "mt-3")}>
                  {group.alts.map((item) => (
                    <GuideCard
                      key={item.id}
                      item={item}
                      kind={kind}
                      tag={tagOf(item, guideTags)}
                      token={token}
                      onTag={handleTag}
                      anchorPrefix={anchorPrefix}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </section>
        ))}
      </div>
    </Section>
  );
}
