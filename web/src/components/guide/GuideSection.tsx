import { Section } from "../layout/Section";
import type { GuideKind } from "../../types";

export interface GuideSectionProps {
  id: string;
  kind: GuideKind;
}

/** ЗАГЛУШКА — заменяется портом справочника. */
export function GuideSection({ id, kind }: GuideSectionProps) {
  return (
    <Section id={id}>
      <div className="rounded-card border border-dashed border-line-strong p-6 text-muted">
        Справочник «{kind}» (в работе)
      </div>
    </Section>
  );
}
