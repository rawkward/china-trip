import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAY_NOTE_MAX_BODY,
  DayNoteError,
  isDayNoteKey,
  normalizeDayNoteBody,
  normalizeDayNoteKey,
  splitDayKey,
} from '../shared/day-notes.js';

test('ключ дня принимает «вариант|ДД.ММ»', () => {
  assert.equal(isDayNoteKey('hk-first|07.12'), true);
  assert.equal(normalizeDayNoteKey('  hk-first|07.12  '), 'hk-first|07.12');
  assert.deepEqual(splitDayKey('hk-first|07.12'), { variant_id: 'hk-first', day_date: '07.12' });
});

test('ключ дня отвергает чужие формы', () => {
  for (const bad of ['', 'hk-first', 'hk-first|7.12', 'hk-first|07.12.2026', '../../etc|07.12', 'hk first|07.12', 'hk-first|07/12']) {
    assert.equal(isDayNoteKey(bad), false, `должен отвергнуть ${JSON.stringify(bad)}`);
    assert.throws(() => normalizeDayNoteKey(bad), DayNoteError);
  }
  assert.throws(() => normalizeDayNoteKey(null), DayNoteError);
});

test('текст заметки нормализуется и режется по краям', () => {
  assert.equal(normalizeDayNoteBody('  В парке дождь  '), 'В парке дождь');
  assert.equal(normalizeDayNoteBody('первая\r\nвторая'), 'первая\nвторая');
  assert.equal(normalizeDayNoteBody('a'.repeat(DAY_NOTE_MAX_BODY)), 'a'.repeat(DAY_NOTE_MAX_BODY));
});

test('пустой и слишком длинный текст — ошибка с кодом', () => {
  assert.throws(() => normalizeDayNoteBody('   '), (err) => err instanceof DayNoteError && err.code === 'empty_body');
  assert.throws(
    () => normalizeDayNoteBody('a'.repeat(DAY_NOTE_MAX_BODY + 1)),
    (err) => err instanceof DayNoteError && err.code === 'body_too_long',
  );
  assert.throws(
    () => normalizeDayNoteBody(42),
    (err) => err instanceof DayNoteError && err.code === 'bad_body',
  );
});
