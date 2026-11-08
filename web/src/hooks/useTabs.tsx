import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { hrefFor, parseHash, tabForSection } from "../lib/tabs";
import type { TabId } from "../lib/tabs";

interface TabsValue {
  tab: TabId;
  navigate: (tab: TabId) => void;
  goSection: (id: string) => void;
}

const TabsContext = createContext<TabsValue | null>(null);

function scrollToAnchor(anchor: string | null) {
  if (typeof window === "undefined") return;

  const run = () => {
    if (!anchor) {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
      } catch {
        // jsdom и старые браузеры: прокрутка не критична для работы вкладок
      }
      return;
    }

    const target = document.getElementById(anchor);
    if (!target) return;

    const details = target.closest("details");
    if (details && !details.open) details.open = true;

    if (typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Даём React дорисовать раздел новой вкладки, и только потом прокручиваем.
  if (typeof window.requestAnimationFrame === "function") {
    window.requestAnimationFrame(run);
  } else {
    window.setTimeout(run, 0);
  }
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === "undefined") return "route";
    return parseHash(window.location.hash).tab;
  });

  const applyHash = useCallback((hash: string) => {
    const parsed = parseHash(hash);
    setTab(parsed.tab);

    if (typeof window !== "undefined") {
      const current = window.location.hash;
      const canonical = hrefFor(parsed.tab, parsed.anchor);
      if (current && current !== canonical) {
        window.history.replaceState(null, "", canonical);
      }
    }

    scrollToAnchor(parsed.anchor);
  }, []);

  useEffect(() => {
    applyHash(window.location.hash);

    const onHashChange = () => applyHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, [applyHash]);

  const navigate = useCallback((next: TabId) => {
    const target = hrefFor(next);
    setTab(next);
    if (typeof window !== "undefined" && window.location.hash !== target) {
      window.history.pushState(null, "", target);
    }
    scrollToAnchor(null);
  }, []);

  const goSection = useCallback(
    (id: string) => {
      const targetTab = tabForSection(id) ?? tab;
      setTab(targetTab);

      const target = hrefFor(targetTab, id);
      if (typeof window !== "undefined" && window.location.hash !== target) {
        window.history.pushState(null, "", target);
      }
      scrollToAnchor(id);
    },
    [tab],
  );

  return (
    <TabsContext.Provider value={{ tab, navigate, goSection }}>
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs(): TabsValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("useTabs must be used inside <TabsProvider>");
  return ctx;
}
