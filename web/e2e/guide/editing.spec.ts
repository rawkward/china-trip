// Мок-конфиг матчит `*editing.spec.ts`, поэтому сценарий справочника
// подключается здесь. Обычный конфиг этот файл игнорирует (`**/editing.spec.ts`).
import { registerGuideTagScenario } from "../guide-tag.scenario";

registerGuideTagScenario();
