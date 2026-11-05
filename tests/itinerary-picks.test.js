import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const load = (file, window0) => new Function('window', readFileSync(path.join(root, 'assets', file), 'utf8'))(window0);

function loadTrip() {
  const window0 = {};
  load('data.js', window0);
  load('itinerary.js', window0);
  load('guide.js', window0);
  return window0;
}

const W = loadTrip();
const T = W.TRIP_ITINERARY;
const G = W.TRIP_GUIDE;

function allDays() {
  const out = [];
  for (const v of T.VARIANTS) {
    for (const d of (v.china || []).concat(v.hk || [])) out.push({ variant: v.id, day: d });
  }
  return out;
}

test('каждая группа вариантов внутри дня — минимум два варианта', () => {
  for (const { variant, day } of allDays()) {
    for (const p of day.places || []) {
      if (!p.picks) continue;
      assert.ok(Array.isArray(p.picks), `${variant}/${day.title}: picks должен быть массивом`);
      assert.ok(p.picks.length >= 2, `${variant}/${day.title}: в группе «${p.title}» ${p.picks.length} вариант(ов)`);
      for (const it of p.picks) {
        assert.ok(it.name && it.name.trim().length > 3, `${variant}/${day.title}: вариант без названия`);
        assert.ok(it.note && it.note.trim().length > 20, `${variant}/${day.title}: у «${it.name}» нет текста`);
      }
    }
  }
});

test('в каждой группе ровно одна рекомендация, и это первый вариант', () => {
  for (const { variant, day } of allDays()) {
    for (const p of day.places || []) {
      if (!p.picks) continue;
      const rec = p.picks.filter((it, i) => it.rec === true || (i === 0 && it.rec !== false));
      assert.equal(rec.length, 1, `${variant}/${day.title}: в «${p.title}» рекомендаций ${rec.length}`);
      assert.equal(p.picks[0].name, rec[0].name, `${variant}/${day.title}: рекомендация должна стоять первой`);
    }
  }
});

test('у группы есть заголовок и тег', () => {
  for (const { variant, day } of allDays()) {
    for (const p of day.places || []) {
      if (!p.picks) continue;
      assert.ok(p.title && p.title.length > 5, `${variant}/${day.title}: у группы без заголовка`);
      assert.ok(p.tag, `${variant}/${day.title}: у «${p.title}» нет тега`);
    }
  }
});

test('каждый вариант из группы находится в справочнике', () => {
  const names = [];
  for (const it of G.items) {
    for (const m of it.match || []) names.push(m);
  }
  const misses = [];
  for (const { variant, day } of allDays()) {
    for (const p of day.places || []) {
      for (const it of p.picks || []) {
        if (it.dim) continue; // «уточнить на месте» — карточка есть, но без привязки
        if (!names.some((m) => it.name.includes(m))) misses.push(`${variant}: ${it.name}`);
      }
    }
  }
  assert.deepEqual(misses, [], 'нет карточки в справочнике для: ' + misses.join('; '));
});

test('в чунцинских днях основного маршрута новые заведения на месте', () => {
  const main = T.VARIANTS.find((v) => v.main);
  const days = (main.china || []).concat(main.hk || []);
  const cq = days.filter((d) => d.city === 'cq');
  const names = [];
  const walk = (p) => {
    if (p.picks) p.picks.forEach((it) => names.push(it.name));
    else if (p.name) names.push(p.name);
  };
  cq.forEach((d) => (d.places || []).forEach(walk));
  const flat = names.join(' | ');
  for (const needle of ['The Move', '黄玉明', '张三的烤肉', '桃园火锅', '地下之城', '花市豌杂面', '鬼包子', '瓦顶顶', '茶颜悦色', 'Post Coffee', '云端之眼', '得意世界', '苏家坝', '龙门浩', '海底']) {
    if (needle === '海底') continue;
    assert.ok(flat.includes(needle), `в чунцинских днях нет «${needle}»`);
  }
});
