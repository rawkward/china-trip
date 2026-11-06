import { COPY } from "../../content/copy";

export function Footer() {
  return (
    <footer className="mt-8 border-t border-line bg-paper-deep/50">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-5">
        <p className="max-w-[86ch] text-[0.82rem] leading-relaxed text-muted">{COPY.footer}</p>
      </div>
    </footer>
  );
}
