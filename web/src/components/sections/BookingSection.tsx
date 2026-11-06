import { BOOKING } from "../../content/booking";
import { Section } from "../layout/Section";

/** Брони: сроки сверху вниз, ссылка — внутри строки (HTML из данных). */
export function BookingSection() {
  return (
    <Section id="booking">
      <ol className="grid gap-3">
        {BOOKING.map((row, i) => (
          <li
            key={i}
            className="surface grid gap-x-5 gap-y-1.5 p-4 sm:grid-cols-[9.5rem_1fr] sm:p-5"
          >
            <div className="flex items-baseline gap-2 sm:block">
              <span className="text-[0.7rem] font-bold tracking-[0.12em] text-muted-soft uppercase">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="tag-pill sm:mt-1">{row.when}</span>
            </div>
            <div
              className="text-[0.92rem] leading-relaxed [&_a]:link-quiet [&_b]:font-semibold"
              dangerouslySetInnerHTML={{ __html: row.it }}
            />
          </li>
        ))}
      </ol>
    </Section>
  );
}
