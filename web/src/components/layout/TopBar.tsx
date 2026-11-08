import { useEffect, useMemo, useState } from "react";
import { COPY } from "../../content/copy";
import { useToken } from "../../edits/auth";
import { useTabs } from "../../hooks/useTabs";
import { cn } from "../../lib/cn";
import { TABS, hrefFor, tabDef, tabHref } from "../../lib/tabs";

/** Липкая шапка: имя поездки, переключатель вкладок и якоря текущей вкладки. */
export function TopBar() {
  const { tab, navigate, goSection } = useTabs();
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const token = useToken();

  const navById = useMemo(
    () => new Map(COPY.nav.map((item) => [item.id, item])),
    [],
  );

  // Приватные разделы (чек-лист) не показываем в меню без входа по паролю.
  const sections = useMemo(
    () =>
      tabDef(tab)
        .sections.map((id) => navById.get(id))
        .filter(
          (item): item is { id: string; label: string; private?: boolean } =>
            item !== undefined && (!item.private || Boolean(token)),
        ),
    [tab, token, navById],
  );

  useEffect(() => {
    setActive("");
    const ids = sections.map((item) => item.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const openTab = (id: (typeof TABS)[number]["id"], close = false) => {
    if (close) setOpen(false);
    navigate(id);
  };

  const openSection = (id: string, close = false) => {
    if (close) setOpen(false);
    goSection(id);
  };

  return (
    <header className="sticky top-0 z-[1100] border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-4 py-2.5 sm:px-5">
        <a
          href={tabHref("route")}
          onClick={(event) => {
            event.preventDefault();
            openTab("route");
          }}
          className="font-display text-[1rem] font-semibold whitespace-nowrap text-ink hover:no-underline"
        >
          {COPY.brand}
        </a>

        <nav
          aria-label="Вкладки"
          className="ml-auto hidden flex-wrap items-center gap-1 text-[0.82rem] font-medium lg:flex"
        >
          {TABS.map((item) => (
            <a
              key={item.id}
              href={tabHref(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                openTab(item.id);
              }}
              className={cn(
                "rounded-lg px-2.5 py-1.5 transition-colors hover:text-ink hover:no-underline",
                tab === item.id ? "bg-paper-deep font-semibold text-accent" : "text-muted",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="topbar-mobile-nav"
          className="chip ml-auto lg:hidden"
        >
          {open ? "Закрыть" : "Разделы"}
        </button>
      </div>

      <div className="mx-auto hidden w-full max-w-[1180px] items-center gap-x-4 gap-y-1 px-4 pb-2 text-[0.82rem] font-medium lg:flex sm:px-5">
        <span className="text-[0.72rem] font-semibold tracking-[0.12em] text-muted-soft uppercase">
          {tabDef(tab).label}
        </span>
        <nav aria-label="Разделы" className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
          {sections.map((item) => (
            <a
              key={item.id}
              href={hrefFor(tab, item.id)}
              onClick={(event) => {
                event.preventDefault();
                openSection(item.id);
              }}
              className={cn(
                "transition-colors hover:text-ink hover:no-underline",
                active === item.id ? "text-accent" : "text-muted",
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {open && (
        <nav
          id="topbar-mobile-nav"
          aria-label="Разделы"
          className="grid grid-cols-1 gap-1 border-t border-line bg-paper px-4 py-3 text-[0.86rem] lg:hidden"
        >
          {TABS.map((item) => (
            <a
              key={item.id}
              href={tabHref(item.id)}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={(event) => {
                event.preventDefault();
                openTab(item.id, true);
              }}
              className={cn(
                "rounded-lg px-2 py-2 font-semibold hover:bg-paper-deep hover:no-underline",
                tab === item.id ? "bg-paper-deep text-accent" : "text-ink",
              )}
            >
              {item.label}
            </a>
          ))}

          {sections.length > 0 ? (
            <div className="mt-1 grid grid-cols-1 gap-1 border-t border-line pt-2">
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={hrefFor(tab, item.id)}
                  onClick={(event) => {
                    event.preventDefault();
                    openSection(item.id, true);
                  }}
                  className={cn(
                    "rounded-lg px-2 py-2 hover:bg-paper-deep hover:no-underline",
                    active === item.id ? "text-accent" : "text-muted",
                  )}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
        </nav>
      )}
    </header>
  );
}
