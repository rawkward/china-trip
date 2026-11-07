import { useToken } from "../../edits/auth";
import { Rule } from "../layout/Section";
import { ChecklistSection } from "./ChecklistSection";

/** Чек-лист и линия после него видны только после входа по паролю. */
export function ChecklistGate() {
  const token = useToken();
  if (!token) return null;
  return (
    <>
      <ChecklistSection />
      <Rule />
    </>
  );
}
