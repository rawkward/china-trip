import { useEffect, useRef, useState } from "react";
import { LINKS } from "../../content/links";
import { SEARCH_GROUPS } from "../../content/search";
import { Badge } from "../ui";
import { Section } from "../layout/Section";

const REDNOTE_LINKS = [
  { label: "Rednote на сайте", url: "https://www.rednote.com" },
  { label: "Приложение · iPhone", url: "https://apps.apple.com/app/id741292507" },
  { label: "Приложение · Android", url: "https://play.google.com/store/apps/details?id=com.xingin.xhs" },
];

/** Внешние гиды: что внутри, что берём, чего нет. */
export function LinksSection() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copyPhrase(zh: string) {
    try {
      await navigator.clipboard.writeText(zh);
    } catch {}
    setCopied(zh);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <Section id="links">
      <div id="rednote" className="surface mb-4 p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Badge tone="accent">Rednote</Badge>
          <span className="text-[0.78rem] text-muted-soft">小红书</span>
        </div>
        <h3 className="text-[1.1rem] leading-snug">Как искать по-китайски в Rednote</h3>
        <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-soft">
          Английский здесь почти не работает: поиск идёт по иероглифам, а половина находок — по связке „город + 小众
          (малоизвестное)“, „宝藏 (скрытые находки)“ или 本地人推荐 (советуют местные)“. Строки ниже — готовые запросы:
          тап копирует иероглифы в буфер, вставлять в строку поиска приложения или сайта.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REDNOTE_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener"
              className="rounded-xl border border-line px-3 py-1.5 text-[0.82rem] font-medium leading-tight text-ink transition hover:border-accent"
            >
              {link.label}
            </a>
          ))}
        </div>
        <div className="mt-4 grid gap-4">
          {SEARCH_GROUPS.map((group) => (
            <div key={group.label} className="min-w-0">
              <h4 className="mb-1.5 flex flex-wrap items-baseline gap-2 text-[0.95rem] font-semibold text-ink">
                {group.label}
                <span className="text-[0.78rem] font-normal text-muted-soft">{group.zh}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {group.phrases.map((phrase) => (
                  <button
                    key={phrase.zh}
                    type="button"
                    onClick={() => copyPhrase(phrase.zh)}
                    className="max-w-full rounded-xl border border-line px-3 py-1.5 text-left text-[0.82rem] leading-tight transition hover:border-accent"
                  >
                    <span className="block font-medium text-ink">{copied === phrase.zh ? "✓ " : ""}{phrase.zh}</span>
                    <span className="block text-[0.76rem] text-muted">{phrase.ru}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
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
