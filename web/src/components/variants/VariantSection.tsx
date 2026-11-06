import { useVariant } from "../../hooks/useVariant";
import { Section } from "../layout/Section";
import { VariantCard } from "./VariantCard";

/** Карточки вариантов: выбор меняет маршрут и уводит к нему. */
export function VariantSection() {
  const { variants, activeId, setVariant } = useVariant();

  const select = (id: string) => {
    setVariant(id);
    const target = document.getElementById("itinerary");
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Section id="variants">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 sm:gap-4">
        {variants.map((variant) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            active={variant.id === activeId}
            onSelect={select}
          />
        ))}
      </div>
    </Section>
  );
}
