import assert from 'node:assert/strict';
import test from 'node:test';

import {
  CHECKLIST_LIMITS,
  ChecklistError,
  newChecklistId,
  normalizeChecklistCap,
  normalizeChecklistText,
} from '../shared/checklist.js';
import { deleteChecklistGroup } from '../worker/src/db.js';

test('название группы: trim, схлопывание пробелов, лимит 120', () => {
  assert.equal(normalizeChecklistCap('  Документы \n и   въезд  '), 'Документы и въезд');
  assert.equal(normalizeChecklistCap('a'.repeat(CHECKLIST_LIMITS.cap)), 'a'.repeat(120));

  for (const bad of ['', '   ', null, undefined]) {
    assert.throws(
      () => normalizeChecklistCap(bad),
      (err) => err instanceof ChecklistError && err.code === 'empty_cap' && err.field === 'cap',
    );
  }

  assert.throws(
    () => normalizeChecklistCap('a'.repeat(CHECKLIST_LIMITS.cap + 1)),
    (err) => err instanceof ChecklistError && err.code === 'cap_too_long' && err.field === 'cap',
  );
});

test('текст пункта: HTML сохраняется, пустые строки схлопываются, пустое запрещено', () => {
  assert.equal(
    normalizeChecklistText('  <b>Палки</b>\r\n\r\n\r\n\r\nкупить дома  '),
    '<b>Палки</b>\n\nкупить дома',
  );
  assert.equal(normalizeChecklistText('<b>A</b>\nB'), '<b>A</b>\nB');
  assert.equal(normalizeChecklistText('a'.repeat(CHECKLIST_LIMITS.text)), 'a'.repeat(2000));

  for (const bad of ['', '  \n\n  ', null, undefined]) {
    assert.throws(
      () => normalizeChecklistText(bad),
      (err) => err instanceof ChecklistError && err.code === 'empty_text' && err.field === 'text',
    );
  }

  assert.throws(
    () => normalizeChecklistText('a'.repeat(CHECKLIST_LIMITS.text + 1)),
    (err) => err instanceof ChecklistError && err.code === 'text_too_long' && err.field === 'text',
  );
});

test('лимиты чек-листа', () => {
  assert.deepEqual(CHECKLIST_LIMITS, {
    cap: 120,
    text: 2000,
    groups: 40,
    itemsPerGroup: 200,
  });
});

test('newChecklistId даёт уникальные id с префиксом', () => {
  const first = newChecklistId('grp');
  const second = newChecklistId('grp');
  assert.match(first, /^grp_[0-9a-f-]{36}$/);
  assert.match(second, /^grp_[0-9a-f-]{36}$/);
  assert.notEqual(first, second);
  assert.match(newChecklistId('itm'), /^itm_/);
  assert.match(newChecklistId(''), /^chk_/);
});

function fakeChecklistDb(groups, items) {
  return {
    prepare(sql) {
      const statement = {
        args: [],
        bind(...args) {
          statement.args = args;
          return statement;
        },
        async first() {
          if (sql.includes('FROM checklist_groups WHERE id = ?')) {
            return groups.find((group) => group.id === statement.args[0]) ?? null;
          }
          if (sql.includes('COUNT(*) AS n FROM checklist_items WHERE group_id = ?')) {
            return { n: items.filter((item) => item.group_id === statement.args[0]).length };
          }
          throw new Error(`unexpected first: ${sql}`);
        },
        async run() {
          if (sql.startsWith('DELETE FROM checklist_items WHERE group_id = ?')) {
            for (let i = items.length - 1; i >= 0; i -= 1) {
              if (items[i].group_id === statement.args[0]) items.splice(i, 1);
            }
            return { success: true };
          }
          if (sql.startsWith('DELETE FROM checklist_groups WHERE id = ?')) {
            const index = groups.findIndex((group) => group.id === statement.args[0]);
            if (index >= 0) groups.splice(index, 1);
            return { success: true };
          }
          throw new Error(`unexpected run: ${sql}`);
        },
      };
      return statement;
    },
  };
}

test('deleteChecklistGroup каскадно удаляет пункты группы', async () => {
  const groups = [
    { id: 'grp_docs', cap: 'Документы', sort: 0, updated_at: 1 },
    { id: 'grp_money', cap: 'Деньги', sort: 1, updated_at: 1 },
  ];
  const items = [
    { id: 'itm_passport', group_id: 'grp_docs', text: 'Паспорт', sort: 0, updated_at: 1 },
    { id: 'itm_visa', group_id: 'grp_docs', text: 'Безвиз', sort: 1, updated_at: 1 },
    { id: 'itm_cash', group_id: 'grp_money', text: 'Наличные', sort: 0, updated_at: 1 },
  ];
  const db = fakeChecklistDb(groups, items);

  const result = await deleteChecklistGroup(db, 'grp_docs');

  assert.deepEqual(result, { items_deleted: 2 });
  assert.deepEqual(
    groups.map((group) => group.id),
    ['grp_money'],
  );
  assert.deepEqual(
    items.map((item) => item.id),
    ['itm_cash'],
  );
});

test('deleteChecklistGroup неизвестной группы — null и без удалений', async () => {
  const groups = [{ id: 'grp_docs', cap: 'Документы', sort: 0, updated_at: 1 }];
  const items = [{ id: 'itm_passport', group_id: 'grp_docs', text: 'Паспорт', sort: 0, updated_at: 1 }];
  const db = fakeChecklistDb(groups, items);

  assert.equal(await deleteChecklistGroup(db, 'missing'), null);
  assert.equal(groups.length, 1);
  assert.equal(items.length, 1);
});
