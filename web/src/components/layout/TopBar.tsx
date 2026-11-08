import { useEffect, useMemo, useState } from "react";
import { COPY } from "../../content/copy";
import { useToken } from "../../edits/auth";
import { cn } from "../../lib/cn";

/** Липкая шапка: имя поездки и якоря разделов. */
export function TopBar() {
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);
  const token = useToken();

  // Приватные разделы (чек-лист) не показываем в меню без входа по паролю.
  const navItems = useMemo(
    () => COPY.nav.filter((item) => !item.private || Boolean(token)),
    [token],
  );

  useEffect(() => {
    const ids = navItems.map((n) => n.id);
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [navItems]);

  return (
    <header className="sticky top-0 z-[1100] border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-4 py-2.5 sm:px-5">
        <a
          href="#top"
          className="font-display text-[1rem] font-semibold whitespace-nowrap text-ink hover:no-underline"
        >
          {COPY.brand}
        </a>

        <nav
          className={cn(
            "ml-auto hidden flex-wrap items-center gap-x-3.5 gap-y-1 lg:flex",
            "text-[0.82rem] font-medium",
          )}
          aria-label="Разделы"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                "transition-colors hover:text-ink hover:no-underline",
                active === item.id ? "text-accent" : "text-muted",
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

      {open && (
        <nav
          id="topbar-mobile-nav"
          aria-label="Разделы"
          className="grid grid-cols-1 gap-1 border-t border-line bg-paper px-4 py-3 text-[0.86rem] lg:hidden"
        >
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              className={cn("rounded-lg px-2 py-2 hover:bg-paper-deep hover:no-underline", active === item.id && "text-accent")}
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}
