import { Section } from "../layout/Section";

/** ЗАГЛУШКА — заменяется портом бюджета (shared/budget-core.js + API). */
export function BudgetApp() {
  return (
    <Section id="budget">
      <div className="rounded-card border border-dashed border-line-strong p-6 text-muted">
        Бюджет (в работе)
      </div>
    </Section>
  );
}
