import test from 'node:test';
import assert from 'node:assert/strict';

import { cityLabel, formatClock, itemWord, rateDiffers } from '../assets/budget.js';

test('itemWord: Russian plural for статьи', () => {
  assert.equal(itemWord(0), 'статей');
  assert.equal(itemWord(1), 'статья');
  assert.equal(itemWord(2), 'статьи');
  assert.equal(itemWord(4), 'статьи');
  assert.equal(itemWord(5), 'статей');
  assert.equal(itemWord(11), 'статей');
  assert.equal(itemWord(14), 'статей');
  assert.equal(itemWord(21), 'статья');
  assert.equal(itemWord(22), 'статьи');
  assert.equal(itemWord(25), 'статей');
});

test('cityLabel: known prefixes translated, unknown humanized', () => {
  assert.equal(cityLabel('cq'), 'Чунцин');
  assert.equal(cityLabel('zzj'), 'Чжанцзяцзе');
  assert.equal(cityLabel('hk'), 'Гонконг');
  assert.equal(cityLabel('xian'), 'Xian');
  assert.equal(cityLabel('new_city'), 'New city');
});

test('rateDiffers: 0.1% threshold', () => {
  assert.equal(rateDiffers(12, 12.01), false);
  assert.equal(rateDiffers(12, 12.02), true);
  assert.equal(rateDiffers(0, 0), false);
  assert.equal(rateDiffers(0, 1), true);
  assert.equal(rateDiffers(undefined, 12), false);
  assert.equal(rateDiffers(12, Number.NaN), false);
});

test('formatClock: HH:MM from a timestamp', () => {
  const at = new Date(2026, 0, 1, 9, 5).getTime();
  assert.equal(formatClock(at), '09:05');
  assert.equal(formatClock(Number.NaN), '—');
});
