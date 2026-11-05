import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STOP_NOTE_MAX_BODY,
  StopNoteError,
  isStopNoteKey,
  normalizeStopNoteBody,
  normalizeStopNoteKey,
  splitStopKey,
} from '../shared/stop-notes.js';

test('ключ остановки принимает «вариант|ДД.ММ|slug»', () => {
  assert.equal(isStopNoteKey('hk-first|15.12|k3f9qa'), true);
  assert.equal(normalizeStopNoteKey('  hk-first|15.12|k3f9qa  '), 'hk-first|15.12|k3f9qa');
  assert.deepEqual(splitStopKey('hk-first|15.12|k3f9qa'), {
    variant_id: 'hk-first',
    day_date: '15.12',
    stop_slug: 'k3f9qa',
  });
});

test('ключ остановки отвергает чужие формы', () => {
  for (const bad of [
    '',
    'hk-first|15.12',
    'hk-first|5.12|k3f9qa',
    'hk-first|15.12|k3',
    '../../etc|15.12|k3f9qa',
    'hk first|15.12|k3f9qa',
    'hk-first|15/12|k3f9qa',
    'hk-first|15.12|k3f9qa|x',
  ]) {
    assert.equal(isStopNoteKey(bad), false, `должен отвергнуть ${JSON.stringify(bad)}`);
    assert.throws(() => normalizeStopNoteKey(bad), StopNoteError);
  }
  assert.throws(() => normalizeStopNoteKey(null), StopNoteError);
});

test('текст остановки нормализуется и режется по краям', () => {
  assert.equal(normalizeStopNoteBody('  Храм до 17:00  '), 'Храм до 17:00');
  assert.equal(normalizeStopNoteBody('первая\r\nвторая'), 'первая\nвторая');
  assert.equal(normalizeStopNoteBody('a'.repeat(STOP_NOTE_MAX_BODY)), 'a'.repeat(STOP_NOTE_MAX_BODY));
});

test('пустой и слишком длинный текст — ошибка с кодом', () => {
  assert.throws(() => normalizeStopNoteBody('   '), (err) => err instanceof StopNoteError && err.code === 'empty_body');
  assert.throws(
    () => normalizeStopNoteBody('a'.repeat(STOP_NOTE_MAX_BODY + 1)),
    (err) => err instanceof StopNoteError && err.code === 'body_too_long',
  );
  assert.throws(() => normalizeStopNoteBody(42), (err) => err instanceof StopNoteError && err.code === 'bad_body');
});
