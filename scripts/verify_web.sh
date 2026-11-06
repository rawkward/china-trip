#!/usr/bin/env bash
# Полная проверка фронтенда перед публикацией: типы, сборка, юнит-тесты, e2e (включая мок API),
# старые тесты в корне и прогон собранной статики по реальному subpath /china-trip/.
#
# Запуск: bash scripts/verify_web.sh
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEB="$ROOT/web"
fail=0

step() {
  echo
  echo "== $1 =="
  shift
  if "$@"; then
    echo "-- ok"
  else
    echo "-- FAIL: $*"
    fail=1
  fi
}

cd "$WEB" || exit 1
step "типы" npx tsc --noEmit
step "сборка" npm run build
step "юнит и компонентные тесты" npm test
step "e2e (смоук, скриншоты, карта)" npx playwright test
step "e2e правок и бюджета (мок API)" npx playwright test -c playwright.mock.config.ts

cd "$ROOT" || exit 1
step "старые тесты shared/worker" npm test

# Собранная статика должна работать из подкаталога — там её и отдаёт GitHub Pages.
SERVE="$ROOT/.verify-site"
rm -rf "$SERVE"
mkdir -p "$SERVE/china-trip"
cp -R "$WEB/dist/." "$SERVE/china-trip/"
cd "$SERVE" || exit 1
python -m http.server 8767 >/dev/null 2>&1 &
SERVER_PID=$!
sleep 2
echo
echo "== собранный сайт по /china-trip/ =="
code=$(curl -s -o /dev/null -m 15 -w '%{http_code}' http://127.0.0.1:8767/china-trip/)
asset=$(curl -s -m 15 http://127.0.0.1:8767/china-trip/ | grep -o '/china-trip/assets/[^"]*\.js' | head -1)
asset_code=$(curl -s -o /dev/null -m 15 -w '%{http_code}' "http://127.0.0.1:8767${asset}")
echo "index: HTTP $code, ассет $asset: HTTP $asset_code"
[ "$code" = "200" ] && [ "$asset_code" = "200" ] || fail=1

kill "$SERVER_PID" 2>/dev/null
rm -rf "$SERVE"

echo
if [ "$fail" = "0" ]; then
  echo "ВСЁ ЗЕЛЁНОЕ — можно публиковать: bash scripts/deploy_web.sh"
else
  echo "ЕСТЬ КРАСНОЕ — смотри вывод выше, публиковать нельзя"
fi
exit "$fail"
