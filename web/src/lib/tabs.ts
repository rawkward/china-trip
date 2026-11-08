export type TabId = "route" | "guide" | "info" | "budget";

export interface TabDef {
  id: TabId;
  label: string;
  /** якоря разделов этой вкладки в порядке появления */
  sections: string[];
}

export const TABS: readonly TabDef[] = [
  { id: "route", label: "Маршрут", sections: ["variants", "itinerary", "missed"] },
  { id: "guide", label: "Справочник", sections: ["stay", "food", "sights", "parks", "tips"] },
  {
    id: "info",
    label: "Практика",
    sections: ["booking", "checklist", "tours", "links"],
  },
  { id: "budget", label: "Бюджет", sections: [] },
];

const TAB_IDS = new Set<string>(TABS.map((tab) => tab.id));

const SECTION_TAB: Record<string, TabId> = {};
for (const tab of TABS) {
  for (const section of tab.sections) SECTION_TAB[section] = tab.id;
}
// «Бюджет» — и вкладка, и единственный раздел на ней; у «top» отдельного раздела нет.
SECTION_TAB.budget = "budget";
SECTION_TAB.top = "route";

export function isTabId(value: string): value is TabId {
  return TAB_IDS.has(value);
}

export function tabDef(tab: TabId): TabDef {
  return TABS.find((item) => item.id === tab) ?? TABS[0];
}

/** Вкладка, которой принадлежит якорь; null — якорь неизвестен. */
export function tabForSection(section: string): TabId | null {
  if (section.startsWith("g-") || section.startsWith("gp-")) return "guide";
  return SECTION_TAB[section] ?? null;
}

export interface ParsedHash {
  tab: TabId;
  /** раздел для прокрутки; null — верх вкладки */
  anchor: string | null;
}

/**
 * Разбирает и новый адрес (`#/guide/sights`), и старые якоря (`#sights`, `#g-…`).
 * Пустой hash открывает «Маршрут».
 */
export function parseHash(hash: string): ParsedHash {
  const raw = hash.replace(/^#/, "").trim();
  if (!raw) return { tab: "route", anchor: null };

  if (raw.startsWith("/")) {
    const [first, ...rest] = raw.split("/").filter(Boolean);
    const tab = first && isTabId(first) ? first : "route";
    const anchor = rest.join("/") || null;
    return { tab, anchor };
  }

  if (raw === "top") return { tab: "route", anchor: null };
  if (raw === "budget") return { tab: "budget", anchor: null };

  const tab = tabForSection(raw);
  if (tab) return { tab, anchor: raw };

  return { tab: "route", anchor: null };
}

function isGuideCardAnchor(section: string): boolean {
  return section.startsWith("g-") || section.startsWith("gp-");
}

/** Канонический адрес вкладки/раздела. Публичные `#g-…`/`#gp-…` не переписываем. */
export function hrefFor(tab: TabId, section?: string | null): string {
  if (!section || section === "top") return `#/${tab}`;

  const target = tabForSection(section) ?? tab;
  if (target !== tab) return `#/${target}/${section}`;
  if (section === tab) return `#/${tab}`;
  if (tab === "guide" && isGuideCardAnchor(section)) return `#${section}`;

  return `#/${tab}/${section}`;
}

export function tabHref(tab: TabId): string {
  return hrefFor(tab);
}
