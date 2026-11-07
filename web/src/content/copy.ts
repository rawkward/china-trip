import raw from "./copy.json";

export interface SectionCopy {
  eyebrow?: string;
  title?: string;
  lede?: string;
  h1?: string;
}

export interface PageCopy {
  brand: string;
  nav: { id: string; label: string; private?: boolean }[];
  footer: string;
  sections: Record<string, SectionCopy>;
}

/** Весь текст разделов — один источник, чтобы заголовки не расползались. */
export const COPY = raw as PageCopy;

export function sectionCopy(id: string): SectionCopy {
  return COPY.sections[id] ?? {};
}
