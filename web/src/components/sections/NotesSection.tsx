import { NOTES } from "../../content/notes";
import { Section } from "../layout/Section";

/** Заметки о ритме и деньгах: карточки-абзацы. */
export function NotesSection() {
  return (
    <Section id="notes">
      <div className="columns-1 gap-4 md:columns-2 xl:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
        {NOTES.map((note) => (
          <article key={note.t} className="surface p-4 sm:p-5">
            <h3 className="mb-1.5 text-[1rem]">{note.t}</h3>
            <p className="text-[0.86rem] leading-relaxed text-muted">{note.b}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}
