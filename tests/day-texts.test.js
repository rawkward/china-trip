import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAY_TEXTS_MAX_FIELDS,
  DAY_TEXT_MAX_LEN,
  DAY_TEXT_TIME_MAX_LEN,
  DayTextError,
  isDayTextKey,
  normalizeDayTextKey,
  normalizeDayTexts,
  splitDayKey,
} from '../shared/day-texts.js';

test('ключ дня принимает «вариант|ДД.ММ»', () => {
  assert.equal(isDayTextKey('hk-first|07.12'), true);
  assert.equal(normalizeDayTextKey('  hk-first|07.12  '), 'hk-first|07.12');
  assert.deepEqual(splitDayKey('hk-first|07.12'), { variant_id: 'hk-first', day_date: '07.12' });
});

test('ключ дня отвергает чужие формы', () => {
  for (const bad of ['', 'hk-first', 'hk-first|7.12', 'hk-first|07.12.2026', '../../etc|07.12', 'hk first|07.12', 'hk-first|07/12']) {
    assert.equal(isDayTextKey(bad), false, `должен отвергнуть ${JSON.stringify(bad)}`);
    assert.throws(() => normalizeDayTextKey(bad), DayTextError);
  }
  assert.throws(() => normalizeDayTextKey(null), DayTextError);
});

test('тексты нормализуются: trim, CRLF, пустые поля удаляются', () => {
  assert.deepEqual(
    normalizeDayTexts({
      title: '  День в Гонконге  ',
      sub: 'первая\r\nвторая',
      'stop:k3f9qa:name': '   ',
      'stop:k3f9qa:cost': '¥20',
      'picks:p1x2y3:title': 'Обед',
      'pick:p1x2y3:0:dim': 'до 18:00',
    }),
    {
      title: 'День в Гонконге',
      sub: 'первая\nвторая',
      'stop:k3f9qa:cost': '¥20',
      'picks:p1x2y3:title': 'Обед',
      'pick:p1x2y3:0:dim': 'до 18:00',
    },
  );
});

test('неизвестное поле — bad_field с именем поля', () => {
  assert.throws(
    () => normalizeDayTexts({ 'stop:k3f9qa:whatever': 'x' }),
    (err) => err instanceof DayTextError && err.code === 'bad_field' && err.field === 'stop:k3f9qa:whatever',
  );
  assert.throws(
    () => normalizeDayTexts({ 'stop:k3:name': 'x' }),
    (err) => err instanceof DayTextError && err.code === 'bad_field' && err.field === 'stop:k3:name',
  );
});

test('не объект и не строка в значении — bad_body', () => {
  for (const bad of [null, 'title', 42, ['title']]) {
    assert.throws(() => normalizeDayTexts(bad), (err) => err instanceof DayTextError && err.code === 'bad_body');
  }
  assert.throws(
    () => normalizeDayTexts({ title: 42 }),
    (err) => err instanceof DayTextError && err.code === 'bad_body' && err.field === 'title',
  );
});

test('слишком длинное значение — body_too_long', () => {
  assert.throws(
    () => normalizeDayTexts({ title: 'a'.repeat(DAY_TEXT_MAX_LEN + 1) }),
    (err) => err instanceof DayTextError && err.code === 'body_too_long' && err.field === 'title',
  );
  assert.doesNotThrow(() => normalizeDayTexts({ title: 'a'.repeat(DAY_TEXT_MAX_LEN) }));
});

test('больше 40 полей — body_too_long', () => {
  const texts = {};
  for (let i = 0; i <= DAY_TEXTS_MAX_FIELDS; i += 1) {
    texts[`stop:a${String(i).padStart(3, '0')}:name`] = `остановка ${i}`;
  }
  assert.throws(
    () => normalizeDayTexts(texts),
    (err) => err instanceof DayTextError && err.code === 'body_too_long',
  );
});

test('пустой объект допустим и возвращается как {}', () => {
  assert.deepEqual(normalizeDayTexts({}), {});
  assert.deepEqual(normalizeDayTexts({ title: '  ', sub: '\r\n' }), {});
});

test('новые поля: время, порядок и замена карточкой справочника', () => {
  assert.deepEqual(
    normalizeDayTexts({
      order: '  k3f9qa,9x2b1c,p7d4e2  ',
      'stop:k3f9qa:time': ' 10:00–12:30 ',
      'picks:p1x2y3:time': '13:00',
      'ref:9x2b1c': ' food|hk|mak-man-kee ',
    }),
    {
      order: 'k3f9qa,9x2b1c,p7d4e2',
      'stop:k3f9qa:time': '10:00–12:30',
      'picks:p1x2y3:time': '13:00',
      'ref:9x2b1c': 'food|hk|mak-man-kee',
    },
  );
});

test('мусор в order — bad_value с именем поля', () => {
  for (const bad of [
    'abc',
    'k3f9qa,',
    'k3f9qa,K3F9QA',
    'k3f9qa, k3f9qa',
    'k3f9qa;9x2b1c',
    'a'.repeat(11),
    Array.from({ length: 41 }, (_, i) => `s${String(i).padStart(5, '0')}`).join(','),
  ]) {
    assert.throws(
      () => normalizeDayTexts({ order: bad }),
      (err) =>
        err instanceof DayTextError &&
        err.code === 'bad_value' &&
        err.field === 'order' &&
        err.message === 'порядок — это slug-и через запятую',
      `должен отвергнуть ${JSON.stringify(bad).slice(0, 80)}`,
    );
  }
});

test('мусор в ref — bad_value с именем поля', () => {
  for (const bad of [
    'mak-man-kee',
    'food|hk',
    'drink|hk|mak-man-kee',
    'food|hk|Mak',
    'food|hk|',
    'food|hk|mak man kee',
    'food|hk|' + 'a'.repeat(41),
  ]) {
    assert.throws(
      () => normalizeDayTexts({ 'ref:k3f9qa': bad }),
      (err) => err instanceof DayTextError && err.code === 'bad_value' && err.field === 'ref:k3f9qa',
    );
  }
});

test('время длиннее 40 символов — body_too_long', () => {
  assert.throws(
    () => normalizeDayTexts({ 'stop:k3f9qa:time': 'a'.repeat(DAY_TEXT_TIME_MAX_LEN + 1) }),
    (err) =>
      err instanceof DayTextError && err.code === 'body_too_long' && err.field === 'stop:k3f9qa:time',
  );
  assert.doesNotThrow(() => normalizeDayTexts({ 'stop:k3f9qa:time': 'a'.repeat(DAY_TEXT_TIME_MAX_LEN) }));
  assert.throws(
    () => normalizeDayTexts({ 'picks:p1x2y3:time': 'a'.repeat(DAY_TEXT_TIME_MAX_LEN + 1) }),
    (err) =>
      err instanceof DayTextError && err.code === 'body_too_long' && err.field === 'picks:p1x2y3:time',
  );
});

test('старая запись без новых полей читается', () => {
  assert.deepEqual(
    normalizeDayTexts({ title: 'День', 'stop:k3f9qa:name': 'Остановка' }),
    { title: 'День', 'stop:k3f9qa:name': 'Остановка' },
  );
});

test('hide принимает валидные slug-и через запятую', () => {
  assert.deepEqual(normalizeDayTexts({ hide: '  k3f9qa,9x2b1c,p7d4e2  ' }), {
    hide: 'k3f9qa,9x2b1c,p7d4e2',
  });
});

test('мусор в hide — bad_value с именем поля', () => {
  for (const bad of ['АБВ', 'k3f9qa, 9x2b1c', 'k3f9qa,,9x2b1c', 'abc', 'k3f9qa,', 'a'.repeat(11)]) {
    assert.throws(
      () => normalizeDayTexts({ hide: bad }),
      (err) =>
        err instanceof DayTextError &&
        err.code === 'bad_value' &&
        err.field === 'hide' &&
        err.message === 'скрытые — это slug-и через запятую',
      `должен отвергнуть ${JSON.stringify(bad)}`,
    );
  }
});

test('пустая строка сбрасывает hide', () => {
  assert.deepEqual(normalizeDayTexts({ hide: '   ' }), {});
  assert.deepEqual(normalizeDayTexts({ hide: '', title: 'День' }), { title: 'День' });
});

test('missed принимает валидные slug-и через запятую', () => {
  assert.deepEqual(normalizeDayTexts({ missed: '  k3f9qa,9x2b1c,p7d4e2  ' }), {
    missed: 'k3f9qa,9x2b1c,p7d4e2',
  });
});

test('мусор в missed — bad_value с именем поля', () => {
  for (const bad of ['АБВ', 'k3f9qa, 9x2b1c', 'k3f9qa,,9x2b1c', 'abc', 'k3f9qa,', 'a'.repeat(11)]) {
    assert.throws(
      () => normalizeDayTexts({ missed: bad }),
      (err) =>
        err instanceof DayTextError &&
        err.code === 'bad_value' &&
        err.field === 'missed' &&
        err.message === 'перенесённые — это slug-и через запятую',
      `должен отвергнуть ${JSON.stringify(bad)}`,
    );
  }
});

test('пустая строка сбрасывает missed', () => {
  assert.deepEqual(normalizeDayTexts({ missed: '   ' }), {});
  assert.deepEqual(normalizeDayTexts({ missed: '', title: 'День' }), { title: 'День' });
});

test('add принимает массив остановок и нормализует поля', () => {
  const raw = JSON.stringify([
    { s: 'a1b2c3', n: '  Название  ', t: 'food', c: ' ¥50 ', d: ' заметка ', g: ' hotel-id ' },
    { s: 'd4e5f6', n: 'Второе', t: '', c: '', d: '', g: '' },
  ]);
  const out = normalizeDayTexts({ add: raw });
  assert.deepEqual(JSON.parse(out.add), [
    { s: 'a1b2c3', n: 'Название', t: 'food', c: '¥50', d: 'заметка', g: 'hotel-id' },
    { s: 'd4e5f6', n: 'Второе' },
  ]);
  assert.equal(out.add, JSON.stringify(JSON.parse(out.add)));
});

test('add: битый JSON — bad_value с именем поля', () => {
  assert.throws(
    () => normalizeDayTexts({ add: '[{"s":"a1b2c3"' }),
    (err) =>
      err instanceof DayTextError &&
      err.code === 'bad_value' &&
      err.field === 'add' &&
      err.message === 'добавленные остановки — это JSON-массив',
  );
  assert.throws(() => normalizeDayTexts({ add: '{"s":"a1b2c3"}' }), DayTextError);
});

test('add: неизвестный тег и битый slug — bad_value', () => {
  assert.throws(
    () => normalizeDayTexts({ add: JSON.stringify([{ s: 'a1b2c3', n: 'Место', t: 'party' }]) }),
    (err) => err instanceof DayTextError && err.code === 'bad_value' && err.field === 'add',
  );
  for (const s of ['abc', 'A1B2C3', 'a'.repeat(11), 'a b c d']) {
    assert.throws(
      () => normalizeDayTexts({ add: JSON.stringify([{ s, n: 'Место' }]) }),
      (err) => err instanceof DayTextError && err.code === 'bad_value' && err.field === 'add',
    );
  }
});

test('add: больше 8 остановок и длинное описание отвергаются', () => {
  const many = Array.from({ length: 9 }, (_, i) => ({ s: 's' + String(i).padStart(5, '0'), n: 'Место ' + i }));
  assert.throws(
    () => normalizeDayTexts({ add: JSON.stringify(many) }),
    (err) => err instanceof DayTextError && err.code === 'bad_value' && err.field === 'add',
  );
  assert.throws(
    () => normalizeDayTexts({ add: JSON.stringify([{ s: 'a1b2c3', n: 'Место', d: 'я'.repeat(301) }]) }),
    (err) => err instanceof DayTextError && err.code === 'bad_value' && err.field === 'add',
  );
});

test('add: пустая строка и пустой массив сбрасывают поле', () => {
  assert.deepEqual(normalizeDayTexts({ add: '   ', title: 'День' }), { title: 'День' });
  assert.deepEqual(normalizeDayTexts({ add: '' }), {});
  assert.deepEqual(normalizeDayTexts({ add: '[]' }), {});
});

test('add: общий лимит 1200 не применяется, но сериализованная строка ограничена 4000', () => {
  const long = Array.from({ length: 5 }, (_, i) => ({
    s: 's' + String(i).padStart(5, '0'),
    n: 'Место ' + i,
    d: 'я'.repeat(300),
  }));
  const raw = JSON.stringify(long);
  assert.ok(raw.length > DAY_TEXT_MAX_LEN);
  assert.ok(raw.length < 4000);
  assert.doesNotThrow(() => normalizeDayTexts({ add: raw }));

  const huge = Array.from({ length: 8 }, (_, i) => ({
    s: 's' + String(i).padStart(5, '0'),
    n: 'я'.repeat(160),
    c: 'я'.repeat(40),
    d: 'я'.repeat(300),
    g: 'я'.repeat(40),
  }));
  assert.ok(JSON.stringify(huge).length > 4000);
  assert.throws(
    () => normalizeDayTexts({ add: JSON.stringify(huge) }),
    (err) => err instanceof DayTextError && err.code === 'body_too_long' && err.field === 'add',
  );
});
