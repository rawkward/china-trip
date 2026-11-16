import { CITIES } from "@/data";
import { DISHES } from "@/content/dishes";
import { dishCountLabel } from "@/lib/dishes";
import { Section } from "../layout/Section";

/** Что поесть: блюда по городам в порядке маршрута, все города раскрыты. */
export function DishesSection() {
  return (
    <Section id="dishes">
      <div className="grid gap-7">
        {DISHES.map((cityDishes) => {
          const city = CITIES[cityDishes.city] ?? {
            label: cityDishes.city,
            color: "#8a8278",
          };
          return (
            <div
              key={cityDishes.city}
              id={"dish-" + cityDishes.city}
              className="scroll-mt-24"
            >
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-[1.15rem] leading-snug">{city.label}</h3>
                <span className="text-[0.8rem] text-muted">
                  {cityDishes.dishes.length} {dishCountLabel(cityDishes.dishes.length)}
                </span>
              </div>
              {cityDishes.intro && (
                <p className="mb-3 text-[0.86rem] leading-relaxed text-muted">
                  {cityDishes.intro}
                </p>
              )}
              <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                {cityDishes.dishes.map((dish) => (
                  <li key={dish.name} className="surface p-3.5">
                    <div className="text-[0.92rem] leading-snug">
                      <span className="font-semibold text-ink">{dish.name}</span>
                      <span className="ml-1.5 text-[0.8rem] text-muted">{dish.zh}</span>
                    </div>
                    <p className="mt-1 text-[0.82rem] leading-relaxed text-ink-soft">
                      {dish.note}
                    </p>
                    {dish.where && (
                      <p className="mt-1 text-[0.78rem] text-muted">где: {dish.where}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
