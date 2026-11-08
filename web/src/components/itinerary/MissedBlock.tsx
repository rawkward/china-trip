import { CITIES, GUIDE, GUIDE_ITEMS } from "@/data";
import { MISSED_NOTES } from "@/content/missed";
import { useEdits } from "@/edits/EditsContext";
import { tagOf } from "@/lib/guide";
import type { GuideItem, GuideKind } from "@/types";

const KIND_ORDER: GuideKind[] = ["stay", "food", "sight", "tip"];

/** «Что выпало»: все альтернативы справочника со ссылкой на карточку. */
export function MissedBlock() {
  const { guideTags } = useEdits();
  const alts = GUIDE_ITEMS.filter((item) => tagOf(item, guideTags) === "alt");

  const cities = Array.from(new Set(alts.map((item) => item.city)));
  const rank = (city: string) => {
    const i = GUIDE.cityOrder.indexOf(city);
    return i === -1 ? GUIDE.cityOrder.length : i;
  };
  cities.sort((a, b) => rank(a) - rank(b));

  const groups = cities.map((city) => {
    const items: GuideItem[] = KIND_ORDER.flatMap((kind) =>
      alts
        .filter((item) => item.city === city && item.kind === kind)
        .sort((a, b) => a.en.localeCompare(b.en, "ru")),
    );
    return {
      city,
      label: CITIES[city]?.label ?? city,
      items,
    };
  });

  return (
    <details id="missed" className="group surface mt-6 scroll-mt-24">
      <summary className="list-none cursor-pointer p-4 select-none sm:p-5 [&::-webkit-details-marker]:hidden">
        <div className="eyebrow mb-1.5">Что выпало</div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="text-[1.15rem] transition-colors hover:text-accent sm:text-[1.3rem]">
            Можно посмотреть ещё
          </h3>
          <span className="text-[0.72rem] font-semibold text-muted-soft">· {alts.length}</span>
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
          Эти места не вошли в план. В справочнике они лежат с пометкой «альтернатива»: по паролю
          любую остановку дня можно заменить карточкой оттуда — из «Мест» того же города.
        </p>

        <div className="mt-4 grid gap-5">
          {groups.map((group) => (
            <section key={group.city} aria-label={group.label}>
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-display text-[1.08rem] font-semibold sm:text-[1.2rem]">
                  {group.label}
                </span>
                <span className="text-[0.72rem] font-semibold text-muted-soft">
                  {group.items.length}
                </span>
              </div>

              <div className="grid grid-cols-1 items-start gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <a
                    key={item.kind + "|" + item.id}
                    href={"#g-" + item.id}
                    className="group flex flex-col gap-1 rounded-xl border border-line bg-paper p-3 transition-colors hover:border-accent hover:no-underline"
                  >
                    <span className="text-[0.68rem] font-bold tracking-[0.12em] text-muted-soft uppercase">
                      {group.label}
                    </span>
                    <span className="text-[0.94rem] font-semibold text-ink group-hover:text-accent">
                      {item.en}
                    </span>
                    {MISSED_NOTES[item.id] ? (
                      <span className="text-[0.82rem] leading-relaxed text-muted">
                        {MISSED_NOTES[item.id]}
                      </span>
                    ) : null}
                    <span className="mt-auto pt-1 text-[0.78rem] font-semibold text-accent">
                      в справочнике →
                    </span>
                  </a>
                ))}
              </div>
              {group.city === "cq" ? (
                <p className="mt-3 text-[0.78rem] leading-relaxed text-muted-soft">
                  Дрон-шоу в Чунцине — по возможности: постоянного графика нет, афишу публикуют за
                  неделю.
                </p>
              ) : null}
            </section>
          ))}
        </div>
      </div>
    </details>
  );
}
