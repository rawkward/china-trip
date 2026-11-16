import { CITIES } from "@/data";
import { DISHES } from "@/content/dishes";
import { cn } from "@/lib/cn";
import { dishCountLabel } from "@/lib/dishes";
import { useTriedDishes } from "@/lib/dishes-tried";
import { Section } from "../layout/Section";

/** Что поесть: блюда по городам в порядке маршрута, все города раскрыты. */
export function DishesSection() {
  const { tried, toggle } = useTriedDishes();

  return (
    <Section id="dishes">
      <div className="grid gap-7">
        {DISHES.map((cityDishes) => {
          const city = CITIES[cityDishes.city] ?? {
            label: cityDishes.city,
            color: "#8a8278",
          };
          const triedCount = cityDishes.dishes.filter((dish) =>
            tried.has(`${cityDishes.city}:${dish.zh}`),
          ).length;
          return (
            <div
              key={cityDishes.city}
              id={"dish-" + cityDishes.city}
              className="scroll-mt-16"
            >
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-[1.15rem] leading-snug">{city.label}</h3>
                <span className="text-[0.8rem] text-muted">
                  {cityDishes.dishes.length} {dishCountLabel(cityDishes.dishes.length)}
                </span>
                {triedCount > 0 && (
                  <span className="text-[0.8rem] text-muted">
                    попробовано {triedCount} из {cityDishes.dishes.length}
                  </span>
                )}
              </div>
              {cityDishes.intro && (
                <p className="mb-3 text-[0.86rem] leading-relaxed text-muted">
                  {cityDishes.intro}
                </p>
              )}
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                {cityDishes.dishes.map((dish) => {
                  const id = `${cityDishes.city}:${dish.zh}`;
                  const isTried = tried.has(id);
                  return (
                    <li
                      key={dish.name}
                      className={cn("surface p-3.5", isTried && "opacity-60")}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={cn(
                            "text-[0.92rem] leading-snug",
                            isTried && "line-through",
                          )}
                        >
                          <span className="font-semibold text-ink">{dish.name}</span>
                          <span className="ml-1.5 text-[0.8rem] text-muted">{dish.zh}</span>
                        </div>
                        <button
                          type="button"
                          aria-pressed={isTried}
                          aria-label="Отметить, что уже попробовали"
                          onClick={() => toggle(id)}
                          className={cn(
                            "btn-soft size-7 shrink-0 p-0 text-[0.9rem] leading-none",
                            isTried && "border-ink text-ink",
                          )}
                        >
                          {isTried ? "✓" : "☐"}
                        </button>
                      </div>
                      <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">
                        {dish.note}
                      </p>
                      {dish.where && (
                        <p className="mt-1 text-[0.78rem] text-muted">где: {dish.where}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
