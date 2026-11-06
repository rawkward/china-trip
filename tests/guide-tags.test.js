import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GUIDE_TAGS,
  GuideTagError,
  isGuideTagKey,
  normalizeGuideTag,
  normalizeGuideTagKey,
  splitGuideTagKey,
} from '../shared/guide-tags.js';

test('ключ тега принимает «вид|город|id»', () => {
  assert.equal(isGuideTagKey('food|hk|mak-man-kee'), true);
  assert.equal(isGuideTagKey('stay|hk|panda-hotel'), true);
  assert.equal(isGuideTagKey('sight|sh|qipu-road'), true);
  assert.equal(normalizeGuideTagKey('  food|hk|mak-man-kee  '), 'food|hk|mak-man-kee');
  assert.deepEqual(splitGuideTagKey('food|hk|mak-man-kee'), {
    kind: 'food',
    city: 'hk',
    guide_id: 'mak-man-kee',
  });
});

test('ключ тега отвергает чужие формы', () => {
  for (const bad of [
    '',
    'food',
    'food|hk',
    'food|hk|',
    'Food|hk|mak-man-kee',
    'food|HK|mak-man-kee',
    'food|hk|Mak Man Kee',
    'food|hk|with space',
    '../../etc|hk|x',
    'food|hk|' + 'a'.repeat(41),
  ]) {
    assert.equal(isGuideTagKey(bad), false, `должен отвергнуть ${JSON.stringify(bad)}`);
    assert.throws(() => normalizeGuideTagKey(bad), GuideTagError);
  }
  assert.throws(() => normalizeGuideTagKey(null), GuideTagError);
});

test('допустимые теги — rec, alt, choice', () => {
  assert.deepEqual(GUIDE_TAGS, ['rec', 'alt', 'choice']);
  for (const tag of GUIDE_TAGS) assert.equal(normalizeGuideTag(tag), tag);
  assert.equal(normalizeGuideTag('  rec  '), 'rec');
});

test('мусор вместо тега — bad_tag', () => {
  for (const bad of ['', 'recommendation', 'REC', null, 42]) {
    assert.throws(
      () => normalizeGuideTag(bad),
      (err) => err instanceof GuideTagError && err.code === 'bad_tag' && err.field === 'tag',
      `должен отвергнуть ${JSON.stringify(bad)}`,
    );
  }
});
