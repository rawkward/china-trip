import { MISSED } from "@/content/missed";
import { CITIES } from "@/data";

/** «Что выпало»: места вне плана со ссылкой на карточку справочника. */
export function MissedBlock() {
  return (
    <div
      id="missed"
      className="surface mt-6 scroll-mt-24 p-4 sm:p-5"
    >
      <div className="eyebrow mb-1.5">Что выпало</div>
      <h3 className="text-[1.15rem] sm:text-[1.3rem]">Можно посмотреть ещё</h3>
      <p className="mt-1.5 max-w-[70ch] text-[0.86rem] leading-relaxed text-muted">
        Эти места не вошли в план. В справочнике они лежат с пометкой «альтернатива»: по паролю
        любую остановку дня можно заменить карточкой оттуда — из «Мест» того же города.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {MISSED.map((row) => (
          <a
            key={row.guideId}
            href={`#g-${row.guideId}`}
            className="group flex flex-col gap-1 rounded-xl border border-line bg-paper p-3 transition-colors hover:border-accent hover:no-underline"
          >
            <span className="text-[0.68rem] font-bold tracking-[0.12em] text-muted-soft uppercase">
              {CITIES[row.city]?.label ?? row.city}
            </span>
            <span className="text-[0.94rem] font-semibold text-ink group-hover:text-accent">
              {row.title}
            </span>
            <span className="text-[0.82rem] leading-relaxed text-muted">{row.note}</span>
            <span className="mt-auto pt-1 text-[0.78rem] font-semibold text-accent">
              в справочнике →
            </span>
          </a>
        ))}
      </div>
      <p className="mt-3 text-[0.78rem] leading-relaxed text-muted-soft">
        Дрон-шоу в Чунцине — по возможности: постоянного графика нет, афишу публикуют за неделю.
      </p>
    </div>
  );
}
