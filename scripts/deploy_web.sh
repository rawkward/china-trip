#!/usr/bin/env bash
# Публикация нового фронтенда на GitHub Pages.
#
# Pages-проект по-прежнему живёт на https://rawkward.github.io/china-trip/,
# но источником теперь служит ветка gh-pages (собранный dist), а не корень main:
# исходники React лежат в web/, билд в репозитории не держим.
#
# Запуск: bash scripts/deploy_web.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# URL забираем до перехода в dist: нативный git не понимает MSYS-пути в `git -C /c/...`.
REMOTE="$(git -C "$(cygpath -w "$ROOT" 2>/dev/null || echo "$ROOT")" remote get-url origin)"
cd "$ROOT/web"

echo "== сборка =="
npm run build

cd "$ROOT/web/dist"
test -f index.html || { echo "нет dist/index.html — сборка не удалась"; exit 1; }
touch .nojekyll

echo "== публикация в gh-pages =="
if [ ! -d .git ]; then
  git init -q -b gh-pages
  git remote add origin "$REMOTE"
fi
git add -A
git commit -q -m "deploy: $(date -u +%Y-%m-%dT%H:%MZ)" || echo "нечего публиковать"
git push -q --force origin gh-pages

echo "== проверка =="
url="https://rawkward.github.io/china-trip/?cb=$RANDOM"
code=$(curl -s -o /dev/null -m 30 -L -w '%{http_code}' "$url")
echo "HTTP $code — $url"
echo "если Pages ещё не переключён на ветку gh-pages:"
echo "  gh api -X PUT repos/rawkward/china-trip/pages -f 'source[branch]=gh-pages' -f 'source[path]=/'"
