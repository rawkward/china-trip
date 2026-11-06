# Контракт фронтенда china-trip (React + TypeScript + Tailwind)

Этот документ — общий для всех, кто портирует страницу. Всё, что здесь описано,
**уже реализовано и менять это нельзя**: данные, типы, слой правок, утилиты, дизайн-токены.
Меняются только файлы, перечисленные в «Твоя зона».

## Стек и команды

- React 19 + TypeScript (strict, `noUnusedLocals`), Vite 8, Tailwind CSS 4 (`@theme` в `src/styles/main.css`), lucide-react (иконки).
- `cd web`
- `npx tsc --noEmit` — типы (обязано быть чисто)
- `npm run build` — сборка
- `npm test` — vitest (unit/компонентные)
- `npx playwright test --project=desktop` — e2e на dev-сервере (порт 8765, base path `/china-trip/`)

Старая страница живёт в корне репозитория (`../index.html`, `../assets/itinerary.js`, `../assets/budget.js`) —
это **источник правды по поведению и тексту**: читай её, когда нужно понять логику. Менять её нельзя.

## Данные (только чтение)

```ts
import { ITINERARY, GUIDE, PLACES, PHOTOS, CITIES, DATES, VARIANTS, GUIDE_ITEMS } from "@/data";
```

- `VARIANTS: Variant[]` — карточки вариантов; `days = buildDays(variant, DATES)`.
- `GUIDE.items: GuideItem[]` (116 карточек, `kind: stay|food|sight|tip`), `GUIDE.cityOrder`, `GUIDE.kinds`.
- `PLACES[k] = {name, lat, lon}` — координаты для карты; `PHOTOS[key].src` — фото карточек вариантов.
- `CITIES[key] = {label, color}` — цвет города приходит из данных, в разметке он инлайновый (`style={{color}}`), не классом.

Типы — `src/types.ts`. Не переопределяй их локально.

## Выбранный вариант

```ts
import { useVariant } from "@/hooks/useVariant";
const { variants, activeId, variant, days, setVariant } = useVariant();
```

`days: Day[]` — блоки выбранного варианта с `n` (номер дня) и `date` (`"07.12 · пн"`).

## Слой правок (дни, остановки, теги) — `useEdits()`

```ts
import { useEdits } from "@/edits/EditsContext";
const {
  token,                       // string | null — правка открыта
  dayNotes, stopNotes,         // Record<key, {body, updated_at}>
  dayTexts,                    // Record<dayKey, Record<field, string>> — правки любого текста дня
  guideTags,                   // Record<tagKey, "rec"|"choice"|"alt">
  editing, setEditing,         // какой элемент сейчас в режиме правки
  error, loading,
  saveDayNote, deleteDayNote,  // (key, body) / (key)
  saveStopNote, resetStopNote, // (key, body) / (key)
  saveText,                    // (dayKey, field, value) — пустая строка = сброс поля
  saveGuideTag,                // (key, tag)
  login, logout, reload,
} = useEdits();
```

- Ключ дня: `noteKey(activeId, day)` → `"hk-first|07.12"` (`src/lib/days.ts`).
- Ключ остановки: `noteKey(...) + "|" + stopSlug(name)` (`src/lib/slug.ts`) либо `stopKey(dayKey, name)` хелпером из `src/lib/texts.ts` — **не собирай ключи руками**, бери функции.
- Поля правки: `stopFieldSet(slug)`, `groupFieldSet(slug)` (`src/lib/texts.ts`).
- Наложение правок на день: `withTexts(day, dayTexts[dayKey] ?? {}, GUIDE_ITEMS)` — возвращает день с подправленными `title/sub/place.name/cost/note/_time` и порядком остановок. Исходные значения — в `_title`/`_name`.
- Ошибки показывай тостом (`import { toast } from "../ui/Toast"`), а не своим баннером.
- Панель входа уже есть (`src/components/layout/AccessBar.tsx`) — свою не рисуй; кнопки правки показывай только при `token`.

## Утилиты (не дублируй логику)

- `src/lib/days.ts` — `buildDays`, `nightWord`→`nightsWord`, `routeGroups`, `noteKey`, `variantDateRange`, `dayByNum`.
- `src/lib/guide.ts` — `guideIdFor`, `tagOf`, `groupGuideByCity`, `refKindForTag`, `GUIDE_TAG_LABELS`, `guideTagKey`.
- `src/lib/texts.ts` — `withTexts`, `stopFieldSet`, `groupFieldSet`, `dayTextValue`.
- `src/lib/map.ts` — `buildMarkerRegistry`, `dayPoints`, `spreadOverlaps`, `gmapsUrl`, `dayMapsUrl`, `TILE_SETS`, `MAP_KINDS`.
- `src/lib/cn.ts` — `cn(...)` для классов.

## UI-кит (`src/components/ui/index.tsx`, `ui/Toast.tsx`)

`Button` (`variant: primary|soft|ghost|danger`, `size: sm|md`), `IconButton` (`label` обязателен),
`Card`, `Badge` (`tone: neutral|accent|solid|muted`), `Input`, `Textarea`, `Select`, `Checkbox` (`id`, `checked`, `onChange(checked)`), `toast(message, "info"|"success"|"error")`, `<Toaster/>` уже в App.

## Дизайн-язык

Тёплый «журнальный» минимализм: бумажный фон, терракота-акцент, крупный антиква-заголовок (Fraunces),
плотный Inter в теле, мягкие тени, крупные радиусы. Правила:

- Только классы Tailwind. Новые CSS-файлы не заводить, `style={{}}` — только для цвета города/фото из данных.
- Токены: `bg-paper`, `bg-paper-deep`, `bg-surface`, `text-ink`, `text-ink-soft`, `text-muted`, `text-muted-soft`,
  `border-line`, `border-line-strong`, `text-accent`, `bg-accent-soft`, `text-accent-ink`, `font-display`,
  `rounded-card` (20px), `shadow-card`, `shadow-lift`, `shadow-pop`.
- Готовые утилиты: `eyebrow`, `muted`, `small`, `prose-lede`, `surface`, `link-quiet`, `field`, `btn`,
  `btn-primary`, `btn-soft`, `btn-ghost`, `btn-danger`, `chip`, `chip-on`, `tag-pill`.
- Заголовок раздела — `<h2>`, карточка — `<h3>`. Размеры: h1 2.1–3.4rem, h2 1.6–2.05rem, h3 1–1.2rem, тело 0.86–0.95rem, подписи 0.72–0.82rem.
- Иконки — lucide-react, `className="size-3.5|4"`, декоративные с `aria-hidden="true"`.
- Мобильный вид обязателен: 390px без горизонтального скролла, тап-таргеты ≥40px, ничего не «уезжает».
- Доступность: кнопки-иконки с `aria-label`, переключатели с `aria-pressed`/`aria-expanded`, поля с `aria-label` или `<label>`, фокус видимый.
- HTML в данных (`<b>`, `<a>`) рендерится через `dangerouslySetInnerHTML` — это единственное допустимое место.

## Правила работы

1. Пиши только в своей зоне (см. задание). Общие файлы (`App.tsx`, `types.ts`, `data/*`, `lib/*`, `edits/*`, `ui/*`,
   `styles/main.css`, `components/layout/*`) не трогай — если чего-то не хватает, обойди или напиши об этом в отчёте.
2. `npx tsc --noEmit` обязан проходить без ошибок; `npm run build` — собираться.
3. Тесты на свою логику — в `src/components/<зона>/*.test.tsx` рядом с компонентом (`npm test`).
4. Никаких `git` команд, коммитов и правок файлов вне своей зоны. Не перезаписывай чужие компоненты.
5. Никаких выдуманных данных и текстов: всё содержимое берётся из `@/data` и `@/content/*`.
6. В отчёте перечисли файлы и что в них проверено (какие тесты/команды реально запускал).
