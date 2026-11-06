# china-trip · фронтенд

Сайт плана поездки: React 19 + TypeScript + Vite + Tailwind CSS 4.
Собирается в статику и публикуется на GitHub Pages (`https://rawkward.github.io/china-trip/`, ветка `gh-pages`).

## Команды

```bash
cd web
npm install          # один раз
npm run dev          # http://127.0.0.1:8765/china-trip/  (порт из CORS Worker'а)
npm run build        # tsc --noEmit && vite build → web/dist
npm test             # vitest: юнит + компонентные тесты
npx playwright test                       # e2e-смоук и скриншоты (desktop + mobile)
npx playwright test e2e/shots.spec.ts     # обновить скриншоты разделов в e2e/shots/
npx playwright test -c playwright.mock.config.ts   # правки/бюджет против мока API
```

Публикация: `bash ../scripts/deploy_web.sh` (собирает и пушит `dist` в `gh-pages`).

## Структура

```
src/
  main.tsx / App.tsx         точка входа и композиция разделов
  data/                      данные поездки (перенесены из старого сайта 1:1)
    itinerary.js             варианты маршрута, дни, остановки       (TRIP_ITINERARY)
    guide.js                 справочники: жильё, еда, места, полезное  (TRIP_GUIDE)
    places.js                координаты мест и фото карточек вариантов
    index.ts                 единая точка импорта с типами
  content/                   контент разделов: брони, чек-лист, туры, ссылки, заметки, тексты разделов
  lib/                       чистая логика: дни, справочник, правки текстов, карта, slug, storage
  api/client.ts              клиент Cloudflare Worker'а (дни, остановки, тексты, теги, бюджет)
  edits/                     слой правок: токен (auth.ts) и контекст EditsContext
  hooks/useVariant.tsx       выбранный вариант маршрута (+ localStorage)
  components/
    layout/                  шапка, hero, подвал, Section, AccessBar
    variants/                карточки вариантов
    itinerary/               дни, остановки, карусель, правки текстов, заметки
    map/                     Leaflet: два режима, фильтры, подложки с фолбэком
    guide/                   справочники (4 вида одним компонентом)
    sections/                брони, чек-лист, туры, ссылки, заметки
    budget/                  бюджет: итоги, параметры, статьи, курс ЦБ
    ui/                      Button, Card, Badge, Input, Checkbox, Toast
  styles/main.css            Tailwind + токены палитры (@theme) и общие утилиты
```

## Как это связано с API

Правки (заметки к дням, тексты остановок, теги справочника) и бюджет живут в Cloudflare D1,
API — Pages Function в проекте `china-trip-api` (`worker/src/*`, общая логика `../shared/*.js`).
Читают все, правит — по общему паролю: токен в `localStorage["chinatrip.budget.token"]` на 30 дней.

Адрес API: `https://china-trip-api.pages.dev`; для локальной проверки переопределяется
`VITE_TRIP_API=http://127.0.0.1:8787 npm run dev` (или `window.__TRIP_API_BASE__`).

## E2E

- `e2e/smoke.spec.ts` — страница поднимается, все разделы на месте, консоль без ошибок.
- `e2e/shots.spec.ts` — скриншоты разделов в `e2e/shots/` для визуальной проверки.
- `e2e/map.spec.ts` — карта: тайлы, точки дня, линия.
- `e2e/editing.spec.ts`, `e2e/budget.spec.ts` — правки и бюджет против мока `e2e/mock-api.mjs`
  (конфиг `playwright.mock.config.ts`, порты 8766/8790, пароль мока — `test`).
