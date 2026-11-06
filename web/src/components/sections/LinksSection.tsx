import { LINKS } from "../../content/links";
import { Badge } from "../ui";
import { Section } from "../layout/Section";

/** Внешние гиды: что внутри, что берём, чего нет. */
export function LinksSection() {
  return (
    <Section id="links">
      <div className="grid gap-4 lg:grid-cols-2">
        {LINKS.map((link) => (
          <article key={link.url} className="surface flex flex-col p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="accent">{link.tag}</Badge>
              <span className="text-[0.78rem] text-muted-soft">{link.src}</span>
            </div>
            <h3 className="text-[1.1rem] leading-snug">
              <a href={link.url} target="_blank" rel="noopener">
                {link.title}
              </a>
            </h3>
            <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-soft">{link.note}</p>
            <dl className="mt-auto grid gap-2 border-t border-line pt-3 text-[0.84rem] leading-relaxed">
              <div>
                <dt className="font-semibold text-ink">Что берём</dt>
                <dd className="text-muted">{link.take}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Чего нет</dt>
                <dd className="text-muted">{link.gap}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </Section>
  );
}
